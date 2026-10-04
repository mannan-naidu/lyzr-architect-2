import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { ModelUnavailableError, resolveModel } from "@/lib/ai/registry.server";
import type { ArchitectUIMessage } from "@/lib/chat/types";
import { llmEnv } from "@/lib/env.server";
import {
  formatMemoryContext,
  getMemoryProvider,
  noopMemory,
  type MemoryAttribution,
} from "@/lib/memory/provider.server";
import type { RecalledMemory } from "@/lib/memory/types";
import { estimateCostUsd } from "@/lib/models";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const maxDuration = 60;

const bodySchema = z.object({
  modelId: z.string().min(3).max(120),
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(z.looseObject({ type: z.string() })),
      }),
    )
    .min(1)
    .max(200),
});

const MAX_OUTPUT_TOKENS = 4_000;

const BUILDER_INSTRUCTIONS = `You are Architect, an AI product engineer that helps people build agentic web apps.
Be concise and concrete. Ask at most one clarifying question when the request is ambiguous.
When you propose a plan, use short numbered steps. Prefer plain language for non-technical users.`;

function textOf(message: { parts: ReadonlyArray<{ type: string; text?: unknown }> }): string {
  return message.parts
    .flatMap((p) => (p.type === "text" && typeof p.text === "string" ? [p.text] : []))
    .join("\n")
    .trim();
}

function json(status: number, error: string, code: string) {
  return Response.json({ error, code }, { status });
}

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/chat">) {
  const { id: projectId } = await ctx.params;
  if (!z.uuid().safeParse(projectId).success) return json(404, "Project not found.", "not_found");

  const user = await getCurrentUser();
  if (!user) return json(401, "Sign in to chat.", "unauthorized");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, "Invalid request body.", "bad_request");
  const { modelId } = parsed.data;
  const messages = parsed.data.messages as unknown as UIMessage[];

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser ? textOf(lastUser) : "";
  if (!userText) return json(400, "Say something first.", "empty_message");

  const supabase = await createClient();

  // RLS: this returns nothing unless the signed-in user owns the project.
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, framework, memory_enabled")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return json(404, "Project not found.", "not_found");

  // Daily token cap across all of this user's projects (protects shared demo keys).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: usageRows } = await supabase
    .from("messages")
    .select("tokens_in, tokens_out")
    .gte("created_at", since);
  const usedToday = (usageRows ?? []).reduce(
    (sum, r) => sum + (r.tokens_in ?? 0) + (r.tokens_out ?? 0),
    0,
  );
  const { DAILY_TOKEN_CAP, DEMO_TOKEN_CAP } = llmEnv();
  const cap = user.isAnonymous ? DEMO_TOKEN_CAP : DAILY_TOKEN_CAP;
  if (usedToday >= cap) {
    const hint = user.isAnonymous ? " Sign in for a higher limit." : " Try again tomorrow.";
    return json(429, `Daily limit reached (${cap.toLocaleString()} tokens).${hint}`, "token_cap");
  }

  let resolved: ReturnType<typeof resolveModel>;
  try {
    resolved = resolveModel(modelId);
  } catch (err) {
    if (err instanceof ModelUnavailableError) return json(400, err.message, err.code);
    throw err;
  }

  // Persist the user's message before streaming so it survives a failed generation.
  await supabase.from("messages").insert({ project_id: projectId, role: "user", content: userText, model: modelId });

  const who: MemoryAttribution = { userId: user.id, projectId, sessionId: projectId };

  const stream = createUIMessageStream<ArchitectUIMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });

      // 1. Recall (shown in the dropdown under the reply).
      const memoryPartId = "memory";
      let memory = noopMemory;
      let recalled: RecalledMemory[] = [];
      if (!project.memory_enabled) {
        writer.write({ type: "data-memory", id: memoryPartId, data: { status: "off", reason: "disabled" } });
      } else {
        const provider = await getMemoryProvider();
        if (!provider) {
          writer.write({ type: "data-memory", id: memoryPartId, data: { status: "off", reason: "unavailable" } });
        } else {
          memory = provider;
          writer.write({ type: "data-memory", id: memoryPartId, data: { status: "recalling" } });
          recalled = await memory.recall(who, userText);
          writer.write({
            type: "data-memory",
            id: memoryPartId,
            data: { status: "recalled", recalled, captured: "pending" },
          });
        }
      }

      // 2. Generate.
      const memoryContext = formatMemoryContext(recalled);
      const projectContext = `Project: ${project.name} (framework: ${project.framework}).${
        project.description ? ` Goal: ${project.description}` : ""
      }`;

      const result = streamText({
        model: resolved.model,
        instructions: [BUILDER_INSTRUCTIONS, projectContext, memoryContext].filter(Boolean).join("\n\n"),
        messages: await convertToModelMessages(messages.filter((m) => m.role !== "system")),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        onEnd: async ({ text, totalUsage }) => {
          try {
            const inputTokens = totalUsage.inputTokens ?? 0;
            const outputTokens = totalUsage.outputTokens ?? 0;

            writer.write({
              type: "data-usage",
              id: "usage",
              data: {
                modelId,
                inputTokens,
                outputTokens,
                costUsd: estimateCostUsd(resolved.option, { inputTokens, outputTokens }),
                billedTo: "user",
              },
            });

            await supabase.from("messages").insert({
              project_id: projectId,
              role: "assistant",
              content: text,
              model: modelId,
              tokens_in: inputTokens,
              tokens_out: outputTokens,
            });

            // 3. Capture for memory (fact extraction runs in the background).
            if (memory !== noopMemory && text) {
              let captured: "saved" | "failed" = "saved";
              try {
                await memory.capture(who, { userText, assistantText: text, modelId });
              } catch (err) {
                captured = "failed";
                console.error("[memory] capture failed:", err instanceof Error ? err.message : err);
              }
              writer.write({ type: "data-memory", id: memoryPartId, data: { status: "recalled", recalled, captured } });
            }

          } finally {
            // We own `finish` so the usage/memory parts above land before the client marks the
            // message complete (the merged stream would otherwise finish first).
            writer.write({ type: "finish" });
          }
        },
      });

      writer.merge(toUIMessageStream({ stream: result.stream, sendStart: false, sendFinish: false }));
    },
    onError: (err) => {
      console.error("[chat] stream error:", err instanceof Error ? err.message : err);
      return "The model call failed. Check the model's API key and try again.";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
