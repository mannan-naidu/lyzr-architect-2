import { Output, streamText } from "ai";
import { z } from "zod";

import { ModelUnavailableError, resolveModel } from "@/lib/ai/registry.server";
import { agentsRuntimeFile } from "@/lib/build/agents-runtime";
import { checkTokenCap, jsonError, requireProject } from "@/lib/build/guard.server";
import { BUILDER_INSTRUCTIONS, planToBuildPrompt } from "@/lib/build/prompts";
import { generatedFilesSchema, planSchema } from "@/lib/build/schemas";
import { logEvent, normalizePath, recordUsage, saveFiles } from "@/lib/build/store.server";
import type { BuildEvent } from "@/lib/build/types";
import { formatMemoryContext, getMemoryProvider } from "@/lib/memory/provider.server";

export const maxDuration = 120;

const bodySchema = z.object({ modelId: z.string().min(3).max(120) });

/**
 * Build the approved plan into a runnable React app. Streams NDJSON BuildEvents so the UI can
 * show "UI getting built": each file appears as the model writes it, then the preview reloads.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/build">) {
  const { id } = await ctx.params;
  const guard = await requireProject(id);
  if (guard instanceof Response) return guard;
  const { user, supabase, project } = guard;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid request body.", "bad_request");
  const plan = planSchema.safeParse(project.plan);
  if (!plan.success || project.plan_status !== "approved") {
    return jsonError(409, "Approve a plan before building.", "plan_not_approved");
  }
  const capped = await checkTokenCap(guard);
  if (capped) return capped;

  let resolved: ReturnType<typeof resolveModel>;
  try {
    resolved = resolveModel(parsed.data.modelId);
  } catch (err) {
    if (err instanceof ModelUnavailableError) return jsonError(400, err.message, err.code);
    throw err;
  }

  const { data: decisionRows } = await supabase.from("decisions").select("text").eq("project_id", id);
  const decisions = (decisionRows ?? []).map((d) => d.text);
  const runId = crypto.randomUUID();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: BuildEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        send({ type: "status", message: "Reading your plan and decisions" });

        let memoryContext: string | null = null;
        if (project.memory_enabled) {
          const memory = await getMemoryProvider();
          if (memory) {
            const recalled = await memory.recall(
              { userId: user.id, projectId: id, sessionId: id },
              `UI style, layout and component preferences for ${plan.data.title}`,
            );
            memoryContext = formatMemoryContext(recalled);
            if (recalled.length) {
              send({ type: "recall", memories: recalled.map((m) => m.content) });
              await logEvent(supabase, {
                projectId: id,
                runId,
                kind: "recall",
                title: `Recalled ${recalled.length} UI preferences`,
                detail: { memories: recalled.map((m) => m.content) },
              });
            }
          }
        }

        send({ type: "status", message: "Writing the UI" });
        const result = streamText({
          model: resolved.model,
          instructions: [BUILDER_INSTRUCTIONS, memoryContext].filter(Boolean).join("\n\n"),
          prompt: planToBuildPrompt(plan.data, decisions),
          output: Output.object({ schema: generatedFilesSchema }),
          maxOutputTokens: 16000,
        });

        const announced = new Set<string>();
        for await (const partial of result.partialOutputStream) {
          for (const f of partial.files ?? []) {
            const path = f?.path ? normalizePath(f.path) : null;
            if (path && !announced.has(path)) {
              announced.add(path);
              send({ type: "file-start", path });
            }
          }
        }

        const output = await result.output;
        const usage = await result.totalUsage;
        const files = [
          ...output.files
            .map((f) => ({ path: normalizePath(f.path), content: f.content }))
            .filter((f) => f.path !== "/agents.ts"),
          { path: "/agents.ts", content: agentsRuntimeFile(plan.data.agents) },
        ];
        if (!files.some((f) => f.path === "/App.tsx")) throw new Error("The model did not produce /App.tsx");

        await saveFiles(supabase, id, files);
        for (const f of files) {
          await logEvent(supabase, {
            projectId: id,
            runId,
            kind: "file",
            title: `Wrote ${f.path}`,
            detail: { lines: f.content.split("\n").length },
          });
        }
        await recordUsage(supabase, {
          projectId: id,
          kind: "build",
          content: `Built ${plan.data.title}: ${output.notes}`,
          modelId: resolved.option.id,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          billedTo: "user",
        });

        // Remember what was built so the next project starts from it.
        if (project.memory_enabled) {
          const memory = await getMemoryProvider();
          await memory?.capture(
            { userId: user.id, projectId: id, sessionId: id },
            {
              userText: `Build ${plan.data.title}. Decisions: ${decisions.join("; ")}`,
              assistantText: `Built ${plan.data.title} with ${files.length} files. ${output.notes}`,
              modelId: resolved.option.id,
            },
          );
        }

        send({
          type: "done",
          files,
          notes: output.notes,
          usage: {
            modelId: resolved.option.id,
            inputTokens: usage.inputTokens ?? 0,
            outputTokens: usage.outputTokens ?? 0,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Build failed";
        console.error("[build] failed:", message);
        await logEvent(supabase, { projectId: id, runId, kind: "error", title: "Build failed", detail: { message } });
        send({ type: "error", message: "The build failed. Try again, or pick a different model." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
