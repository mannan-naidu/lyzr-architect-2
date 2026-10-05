import { generateText, Output } from "ai";
import { z } from "zod";

import { ModelUnavailableError, resolveModel } from "@/lib/ai/registry.server";
import { checkTokenCap, jsonError, requireProject } from "@/lib/build/guard.server";
import { fixAgentImports } from "@/lib/build/agents-runtime";
import { FIXER_INSTRUCTIONS, SEO_BUILD_RULES } from "@/lib/build/prompts";
import { fixSchema } from "@/lib/build/schemas";
import { errorSignature } from "@/lib/build/signature";
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
 *  1. fingerprint the error; look up every past attempt for it across the user's projects;
 *  2. if a fix worked before, reuse it; never repeat an approach that already failed;
 *  3. after MAX_ATTEMPTS failures in this project, roll back to the last good files and ask one question.
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
  const runId = crypto.randomUUID();

  // The error came back, so any fix still pending for it in this project didn't work.
  await supabase
    .from("fix_attempts")
    .update({ outcome: "failed" })
    .eq("project_id", id)
    .eq("error_signature", signature)
    .eq("outcome", "pending");

  // Fix memory: all attempts for this error, across the user's projects (RLS: own rows only).
  const { data: history } = await supabase
    .from("fix_attempts")
    .select("id, project_id, attempt, fix_summary, outcome, created_at")
    .eq("error_signature", signature)
    .order("created_at", { ascending: false })
    .limit(30);
  const attempts = history ?? [];
  const lastSuccessHere = attempts.find((a) => a.project_id === id && a.outcome === "succeeded");
  const streak = attempts.filter(
    (a) =>
      a.project_id === id &&
      a.outcome === "failed" &&
      (!lastSuccessHere || a.created_at > lastSuccessHere.created_at),
  );
  const knownFix = attempts.find((a) => a.outcome === "succeeded") ?? null;
  const avoided = [...new Set(attempts.filter((a) => a.outcome === "failed").map((a) => a.fix_summary))].slice(0, 6);

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
    detail: { signature, knownFix: Boolean(knownFix), avoided: avoided.length },
  });

  const context = [
    `Error:\n${errorText}`,
    knownFix ? `Known fix from the user's history (worked before):\n- ${knownFix.fix_summary}` : "",
    avoided.length ? `Already tried and failed (do not repeat):\n${avoided.map((a) => `- ${a}`).join("\n")}` : "",
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
        fix_summary: fix.summary.slice(0, 500),
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
      detail: { attemptId: attemptRow?.id ?? null, signature, diagnosis: fix.diagnosis, before } as unknown as Json,
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
