import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { generateText, Output } from "ai";
import { z } from "zod";

import { availableProviders, resolveModel } from "@/lib/ai/registry.server";
import type { MemoryProvider } from "@/lib/memory/provider.server";
import type { Database } from "@/lib/types/database";

/**
 * Builder memory stored natively in Supabase Postgres (ADR-006). No native code, so it runs on
 * Vercel's serverless runtime, where Memori's prebuilt engine can't load.
 *
 * - capture: a fast model extracts durable facts from the turn; `memory_upsert` merges near-
 *   duplicates (pg_trgm similarity) and records which projects a fact was seen in.
 * - recall: `memory_search` ranks facts by full-text match + fuzzy similarity + reinforcement;
 *   the user's most-reinforced preferences top it up, since they matter to every build.
 *
 * Runs with the service-role key (capture happens after the response has streamed, outside the
 * user's request), so every query is explicitly scoped to the user's id. The table also has
 * owner-only RLS for any direct client access.
 */

const factsSchema = z.object({
  facts: z
    .array(z.string())
    .describe(
      "0-5 durable facts about the user: preferences, tech stack, style, tools, company, recurring decisions. " +
        "Each one short sentence starting with 'The user'. Exclude one-off requests, questions and anything about this reply.",
    ),
});

const EXTRACTION_INSTRUCTIONS = `You maintain long-term memory for an AI app builder.
From the conversation turn, extract only facts about the USER that will still be true and useful in
future projects (e.g. "The user deploys on Vercel.", "The user prefers minimal dark UIs.").
Never store secrets, keys, passwords or personal contact data. If nothing durable was said, return no facts.`;

/** Cheapest fast model that has a key: extraction doesn't need a frontier model. */
function extractionModelId(): string | null {
  const available = availableProviders();
  const preference = [
    "groq:openai/gpt-oss-20b",
    "anthropic:claude-haiku-4-5",
    "google:gemini-3.5-flash",
    "openai:gpt-5.5",
    "openrouter:meta-llama/llama-3.3-70b-instruct",
  ];
  return preference.find((id) => available.includes(id.split(":")[0] as (typeof available)[number])) ?? null;
}

const MAX_TOPUP = 3;

export function createPostgresMemoryProvider(): MemoryProvider {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Postgres memory needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const db = createSupabaseClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    name: "postgres",

    async recall(who, query) {
      try {
        const { data, error } = await db.rpc("memory_search", { p_owner: who.userId, p_query: query, p_limit: 6 });
        if (error) throw new Error(error.message);
        const found = (data ?? []).map((r) => ({
          content: r.content,
          score: Math.min(1, Number(r.score)),
          scope: "user" as const,
          createdAt: r.created_at,
        }));
        if (found.length >= MAX_TOPUP) return found;
        // Top up with the user's strongest preferences (they shape every build).
        const { data: top } = await db
          .from("memories")
          .select("content, created_at")
          .eq("owner_id", who.userId)
          .order("times_seen", { ascending: false })
          .order("last_seen_at", { ascending: false })
          .limit(MAX_TOPUP + found.length);
        const seen = new Set(found.map((f) => f.content));
        const extra = (top ?? [])
          .filter((t) => !seen.has(t.content))
          .slice(0, MAX_TOPUP - found.length)
          .map((t) => ({ content: t.content, score: 0.2, scope: "user" as const, createdAt: t.created_at }));
        return [...found, ...extra];
      } catch (err) {
        console.error("[memory] recall failed:", err instanceof Error ? err.message : err);
        return [];
      }
    },

    async capture(who, turn) {
      const modelId = extractionModelId();
      if (!modelId) return;
      const { model } = resolveModel(modelId);
      const { output } = await generateText({
        model,
        instructions: EXTRACTION_INSTRUCTIONS,
        prompt: `User said:\n${turn.userText.slice(0, 4000)}\n\nAssistant replied:\n${turn.assistantText.slice(0, 4000)}`,
        output: Output.object({ schema: factsSchema }),
        maxOutputTokens: 600,
      });
      for (const fact of output.facts.slice(0, 5)) {
        const content = fact.trim().slice(0, 1000);
        if (content.length < 8) continue;
        const { error } = await db.rpc("memory_upsert", { p_owner: who.userId, p_project: who.projectId, p_content: content });
        if (error) throw new Error(error.message);
      }
    },

    async list(userId, projectId) {
      const { data, error } = await db
        .from("memories")
        .select("id, content, times_seen, created_at, last_seen_at, project_ids")
        .eq("owner_id", userId)
        .order("last_seen_at", { ascending: false })
        .limit(300);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => ({
        id: r.id,
        content: r.content,
        timesSeen: r.times_seen,
        createdAt: r.created_at,
        lastSeenAt: r.last_seen_at,
        inProject: r.project_ids.includes(projectId),
      }));
    },

    async update(userId, memoryId, content) {
      const { data, error } = await db
        .from("memories")
        .update({ content, last_seen_at: new Date().toISOString() })
        .eq("owner_id", userId)
        .eq("id", memoryId)
        .select("id");
      if (error) throw new Error(error.message);
      return (data ?? []).length > 0;
    },

    async remove(userId, memoryId) {
      const { data, error } = await db.from("memories").delete().eq("owner_id", userId).eq("id", memoryId).select("id");
      if (error) throw new Error(error.message);
      return (data ?? []).length > 0;
    },

    async forgetProject(userId, projectId) {
      // Facts seen only in this project are deleted; shared facts just lose this project.
      const { data: only, error } = await db
        .from("memories")
        .delete()
        .eq("owner_id", userId)
        .eq("project_ids", [projectId])
        .select("id");
      if (error) throw new Error(error.message);
      const { data: shared } = await db
        .from("memories")
        .select("id, project_ids")
        .eq("owner_id", userId)
        .contains("project_ids", [projectId]);
      for (const row of shared ?? []) {
        await db
          .from("memories")
          .update({ project_ids: row.project_ids.filter((p) => p !== projectId) })
          .eq("owner_id", userId)
          .eq("id", row.id);
      }
      return (only ?? []).length;
    },
  };
}
