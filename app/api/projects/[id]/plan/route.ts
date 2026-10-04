import { generateText, Output } from "ai";
import { z } from "zod";

import { ModelUnavailableError, resolveModel } from "@/lib/ai/registry.server";
import { checkTokenCap, jsonError, requireProject } from "@/lib/build/guard.server";
import { PLANNER_INSTRUCTIONS } from "@/lib/build/prompts";
import { planSchema } from "@/lib/build/schemas";
import { logEvent, recordUsage } from "@/lib/build/store.server";
import { formatMemoryContext, getMemoryProvider } from "@/lib/memory/provider.server";
import type { RecalledMemory } from "@/lib/memory/types";

export const maxDuration = 60;

const bodySchema = z.object({
  modelId: z.string().min(3).max(120),
  /** Extra direction from the user ("make it simpler", "add Slack"); optional on first plan. */
  prompt: z.string().trim().max(4000).optional(),
});

/** Generate (or regenerate) the project's plan: screens, agents, decisions, one open question. */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/plan">) {
  const { id } = await ctx.params;
  const guard = await requireProject(id);
  if (guard instanceof Response) return guard;
  const { user, supabase, project } = guard;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid request body.", "bad_request");
  const capped = await checkTokenCap(guard);
  if (capped) return capped;

  let resolved: ReturnType<typeof resolveModel>;
  try {
    resolved = resolveModel(parsed.data.modelId);
  } catch (err) {
    if (err instanceof ModelUnavailableError) return jsonError(400, err.message, err.code);
    throw err;
  }

  const runId = crypto.randomUUID();
  const ask = [project.description, parsed.data.prompt].filter(Boolean).join("\n\nChange request: ");
  if (!ask) return jsonError(400, "Describe what to build first.", "empty_prompt");

  // Memory: what do we already know about how this user builds?
  let recalled: RecalledMemory[] = [];
  if (project.memory_enabled) {
    const memory = await getMemoryProvider();
    if (memory) {
      recalled = await memory.recall({ userId: user.id, projectId: id, sessionId: id }, `${ask}\nstack, style, preferences`);
      await logEvent(supabase, {
        projectId: id,
        runId,
        kind: "recall",
        title: recalled.length ? `Recalled ${recalled.length} memories` : "No relevant memories",
        detail: { memories: recalled.map((m) => m.content) },
      });
    }
  }

  const previous = parsed.data.prompt && project.plan ? `Current plan (revise it):\n${JSON.stringify(project.plan)}` : "";

  try {
    const result = await generateText({
      model: resolved.model,
      instructions: [PLANNER_INSTRUCTIONS, formatMemoryContext(recalled)].filter(Boolean).join("\n\n"),
      prompt: [`Plan this app (framework for agents: ${project.framework}):\n${ask}`, previous].filter(Boolean).join("\n\n"),
      output: Output.object({ schema: planSchema }),
      maxOutputTokens: 6000,
    });
    const plan = result.output;
    const inputTokens = result.totalUsage.inputTokens ?? 0;
    const outputTokens = result.totalUsage.outputTokens ?? 0;

    await supabase
      .from("projects")
      .update({ plan, plan_status: "draft", agent_spec: plan.agents })
      .eq("id", id);
    await recordUsage(supabase, {
      projectId: id,
      kind: "plan",
      content: `Plan: ${plan.title}. ${plan.summary}`,
      modelId: resolved.option.id,
      inputTokens,
      outputTokens,
      billedTo: "user",
    });
    await logEvent(supabase, {
      projectId: id,
      runId,
      kind: "plan",
      title: `Planned “${plan.title}”: ${plan.screens.length} screens, ${plan.agents.length} agents`,
      detail: { decisions: plan.decisions },
      tokensIn: inputTokens,
      tokensOut: outputTokens,
    });

    return Response.json({ plan, recalled, usage: { inputTokens, outputTokens, modelId: resolved.option.id } });
  } catch (err) {
    console.error("[plan] failed:", err instanceof Error ? err.message : err);
    await logEvent(supabase, { projectId: id, runId, kind: "error", title: "Planning failed" });
    return jsonError(502, "The model couldn't produce a plan. Try again or pick another model.", "plan_failed");
  }
}
