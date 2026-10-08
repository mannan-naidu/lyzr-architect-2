import { generateText, Output } from "ai";
import { z } from "zod";

import { ModelUnavailableError, resolveModel } from "@/lib/ai/registry.server";
import { checkTokenCap, jsonError, requireProject } from "@/lib/build/guard.server";
import { fixAgentImports } from "@/lib/build/agents-runtime";
import { FIXER_INSTRUCTIONS, SEO_BUILD_RULES } from "@/lib/build/prompts";
import { fixSchema } from "@/lib/build/schemas";
import { errorLocation, errorSignature } from "@/lib/build/signature";
import { logEvent, normalizePath, recordUsage, saveFiles } from "@/lib/build/store.server";
import type { FixResponse, WorkspaceFile } from "@/lib/build/types";
import { getMemoryProvider } from "@/lib/memory/provider.server";
import type { Json } from "@/lib/types/database";

export const maxDuration = 90;

/** After this many failed fixes for the same error, stop, roll back and ask the user. */
const MAX_ATTEMPTS = 3;

const bodySchema = z.object({
  modelId: z.string().min(3).max(120),
  error: z.string().trim().min(1).max(4000),
});

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });

/**
 * Fix a preview error, using fix memory:
 *  1. fingerprint the error (message signature + location) and look up past attempts with the same
 *     message across the user's projects. These are candidates, not answers: one message can have
 *     several root causes, so the model always diagnoses from the current code first.
 *  2. same message at the same place → strong hint; elsewhere → weak hint. The model reuses a known
 *     fix only if its own diagnosis finds the same cause, and never repeats a fix that failed here.
 *  3. after MAX_ATTEMPTS failures on the same error at the same place in this project, roll back to
 *     the last good files and ask one question.
 * Self-fix tokens are recorded as billed to the agent, not the user (fair-billing ledger).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/fix">) {
  const { id } = await ctx.params;
  const guard = await requireProject(id);
  if (guard instanceof Response) return guard;
  const { user, supabase, project } = guard;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid request body.", "bad_request");
  const capped = await checkTokenCap(guard, "agent");
  if (capped) return capped;

  const { error: errorText } = parsed.data;
  const signature = errorSignature(errorText);
  const location = errorLocation(errorText);
  const runId = crypto.randomUUID();
  // Same place = same file and offending line (or both errors name no file).
  const samePlace = (message: string) => errorLocation(message) === location;

  // Fix memory: every attempt with this message signature, across the user's projects (RLS: own rows).
  const { data: history } = await supabase
    .from("fix_attempts")
    .select("id, project_id, attempt, fix_summary, outcome, created_at, error_message")
    .eq("error_signature", signature)
    .order("created_at", { ascending: false })
    .limit(30);
  const attempts = history ?? [];

  // The same error came back at the same place, so a fix still pending there didn't work. (If it
  // moved elsewhere, the earlier fix may well have worked and this is a different problem.)
  const failedNow = attempts.filter((a) => a.project_id === id && a.outcome === "pending" && samePlace(a.error_message));
  if (failedNow.length) {
    await supabase.from("fix_attempts").update({ outcome: "failed" }).in("id", failedNow.map((a) => a.id));
    for (const a of failedNow) a.outcome = "failed";
  }

  const here = attempts.filter((a) => a.project_id === id && samePlace(a.error_message));
  const lastSuccessHere = here.find((a) => a.outcome === "succeeded");
  const streak = here.filter(
    (a) => a.outcome === "failed" && (!lastSuccessHere || a.created_at > lastSuccessHere.created_at),
  );
  // Hints, strongest first: a success at the same place, else a success with the same message elsewhere.
  const succeeded = attempts.filter((a) => a.outcome === "succeeded");
  const strongFix = succeeded.find((a) => samePlace(a.error_message)) ?? null;
  const weakFixes = succeeded.filter((a) => a !== strongFix).slice(0, 3);
  const knownFix = strongFix ?? weakFixes[0] ?? null;
  const failedHere = [...new Set(here.filter((a) => a.outcome === "failed").map((a) => a.fix_summary))].slice(0, 6);
  const failedElsewhere = [
    ...new Set(attempts.filter((a) => a.outcome === "failed" && !here.includes(a)).map((a) => a.fix_summary)),
  ].slice(0, 4);
  const avoided = failedHere;

  // ── Loop breaker ──────────────────────────────────────────────────────────────────────────
  if (streak.length >= MAX_ATTEMPTS) {
    const first = streak[streak.length - 1];
    const { data: snapshotEvent } = await supabase
      .from("run_events")
      .select("detail")
      .eq("project_id", id)
      .eq("kind", "fix")
      .contains("detail", { attemptId: first.id })
      .maybeSingle();
    const before = z
      .object({ before: z.array(z.object({ path: z.string(), content: z.string() })) })
      .safeParse(snapshotEvent?.detail);
    if (before.success && before.data.before.length) {
      await saveFiles(supabase, id, before.data.before);
    }
    await supabase
      .from("fix_attempts")
      .update({ outcome: "rolled_back" })
      .in(
        "id",
        streak.map((a) => a.id),
      );
    await logEvent(supabase, {
      projectId: id,
      runId,
      kind: "fix",
      title: `Loop breaker: ${streak.length} failed fixes, rolled back and asked the user`,
      detail: { signature, error: errorText.slice(0, 300) },
    });
    const files = await currentFiles(supabase, id);
    const response: FixResponse = {
      status: "loop_broken",
      signature,
      attempts: streak.length,
      question: `I tried ${streak.length} different fixes for “${errorText.split("\n")[0].slice(0, 120)}” and none worked, so I rolled back to the version before my first attempt. Could you tell me what this part should do, or paste the exact steps that trigger the error?`,
      files,
    };
    return Response.json(response);
  }

  let resolved: ReturnType<typeof resolveModel>;
  try {
    resolved = resolveModel(parsed.data.modelId);
  } catch (err) {
    if (err instanceof ModelUnavailableError) return jsonError(400, err.message, err.code);
    throw err;
  }

  const files = await currentFiles(supabase, id);
  if (!files.length) return jsonError(409, "Build the app before fixing it.", "no_files");

  await logEvent(supabase, {
    projectId: id,
    runId,
    kind: "error",
    title: errorText.split("\n")[0].slice(0, 160),
    detail: { signature, location, strongHint: Boolean(strongFix), weakHints: weakFixes.length, avoided: avoided.length },
  });

  const context = [
    `Error:\n${errorText}`,
    strongFix
      ? `Hint (strong): the same error at the same place was fixed before (${dateFmt.format(new Date(strongFix.created_at))}):\n- ${strongFix.fix_summary}\nConfirm the root cause is the same before reusing it.`
      : "",
    weakFixes.length
      ? `Hints (weak): the same error message was fixed elsewhere, possibly for a different reason:\n${weakFixes.map((a) => `- ${a.fix_summary}`).join("\n")}\nReuse only if your diagnosis finds the same cause.`
      : "",
    failedHere.length ? `Already tried here and failed (do not repeat):\n${failedHere.map((a) => `- ${a}`).join("\n")}` : "",
    failedElsewhere.length
      ? `Failed for this message elsewhere (different context, may not apply):\n${failedElsewhere.map((a) => `- ${a}`).join("\n")}`
      : "",
    `Files:\n${files
      .filter((f) => f.path !== "/agents.ts")
      .map((f) => `--- ${f.path}\n${f.content}`)
      .join("\n\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result = await generateText({
      model: resolved.model,
      instructions: project.seo_enabled ? `${FIXER_INSTRUCTIONS}\n\nKeep these rules intact:\n${SEO_BUILD_RULES}` : FIXER_INSTRUCTIONS,
      prompt: context,
      output: Output.object({ schema: fixSchema }),
      maxOutputTokens: 12000,
    });
    const fix = result.output;
    const changed = fixAgentImports(
      fix.files.map((f) => ({ path: normalizePath(f.path), content: f.content })).filter((f) => f.path !== "/agents.ts"),
    );
    const before = files.filter((f) => changed.some((c) => c.path === f.path));
    const attemptNo = streak.length + 1;
    const inputTokens = result.totalUsage.inputTokens ?? 0;
    const outputTokens = result.totalUsage.outputTokens ?? 0;

    const { data: attemptRow } = await supabase
      .from("fix_attempts")
      .insert({
        project_id: id,
        owner_id: user.id,
        error_signature: signature,
        error_message: errorText.slice(0, 2000),
        attempt: attemptNo,
        // Keep the diagnosed cause with the fix, so future hints can be compared cause-to-cause.
        fix_summary: `${fix.summary} (cause: ${fix.diagnosis})`.slice(0, 500),
        tokens: inputTokens + outputTokens,
      })
      .select("id")
      .single();

    await saveFiles(supabase, id, changed);
    await logEvent(supabase, {
      projectId: id,
      runId,
      kind: "fix",
      title: `Fix attempt ${attemptNo}: ${fix.summary}`,
      detail: {
        attemptId: attemptRow?.id ?? null,
        signature,
        location,
        diagnosis: fix.diagnosis,
        usedKnownFix: fix.usedKnownFix,
        before,
      } as unknown as Json,
      tokensIn: inputTokens,
      tokensOut: outputTokens,
    });
    // Self-fix: recorded for transparency, billed to the agent, not the user.
    await recordUsage(supabase, {
      projectId: id,
      kind: "fix",
      content: `Self-fix: ${fix.summary}`,
      modelId: resolved.option.id,
      inputTokens,
      outputTokens,
      billedTo: "agent",
    });

    if (project.memory_enabled) {
      const memory = await getMemoryProvider();
      await memory?.capture(
        { userId: user.id, projectId: id, sessionId: id },
        {
          userText: `The preview crashed with: ${errorText.split("\n")[0].slice(0, 200)}`,
          assistantText: `Root cause: ${fix.diagnosis} Fix: ${fix.summary}`,
          modelId: resolved.option.id,
        },
      );
    }

    const response: FixResponse = {
      status: "fixed",
      signature,
      attempt: attemptNo,
      diagnosis: fix.diagnosis,
      summary: fix.summary,
      knownFix: knownFix ? { summary: knownFix.fix_summary, when: dateFmt.format(new Date(knownFix.created_at)) } : null,
      usedKnownFix: Boolean(knownFix) && fix.usedKnownFix,
      avoided,
      files: await currentFiles(supabase, id),
      usage: { modelId: resolved.option.id, inputTokens, outputTokens },
    };
    return Response.json(response);
  } catch (err) {
    console.error("[fix] failed:", err instanceof Error ? err.message : err);
    return jsonError(502, "The model couldn't produce a fix. Try again or pick another model.", "fix_failed");
  }
}

async function currentFiles(
  supabase: Awaited<ReturnType<typeof requireProject>> extends infer G ? (G extends { supabase: infer S } ? S : never) : never,
  projectId: string,
): Promise<WorkspaceFile[]> {
  const { data } = await supabase.from("project_files").select("path, content").eq("project_id", projectId).order("path");
  return data ?? [];
}
