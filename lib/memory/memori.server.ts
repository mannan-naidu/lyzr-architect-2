import "server-only";

import { Memori } from "@memorilabs/memori";
import pg from "pg";

import type { MemoryProvider } from "@/lib/memory/provider.server";

/** Memori keeps its tables in their own schema, next to (not inside) our app tables. */
const SCHEMA = "memori";

/** Drop weak matches so the recall dropdown only shows memories that actually influenced the turn. */
const MIN_SCORE = 0.25;

/**
 * Memori (BYODB) on our Supabase Postgres. We call the model through the Vercel AI SDK, which
 * Memori can't intercept, so we use its framework-integration API (exported as
 * `OpenClawIntegration`) to recall before and capture after each turn. See docs/memori-spike.md.
 */
export async function createMemoriProvider(connectionString: string): Promise<MemoryProvider> {
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  try {
    await admin.query(`create schema if not exists ${pg.escapeIdentifier(SCHEMA)}`);
  } finally {
    await admin.end();
  }

  // search_path is set at connection start (not with a SET after connect) so it applies before
  // Memori's first query. Requires Supabase's *session* pooler (port 5432).
  const pool = new pg.Pool({
    connectionString,
    max: 5,
    options: `-c search_path=${SCHEMA}`,
  });

  // `@memorilabs/memori/integrations` only declares an ESM ("import") export, so load it with a
  // dynamic import; a static import can compile to require() and fail to resolve.
  const { OpenClawIntegration } = await import("@memorilabs/memori/integrations");

  const memori = new Memori({ conn: () => pool });
  await memori.config.storage?.build();

  const scoped = (who: { userId: string; projectId: string; sessionId: string }) =>
    memori.forRequest({ entityId: who.userId, processId: who.projectId, sessionId: who.sessionId });

  return {
    name: "memori",

    async recall(who, query) {
      try {
        const facts = await scoped(who).recall(query);
        return facts
          .filter((f) => f.score >= MIN_SCORE)
          .slice(0, 8)
          .map((f) => ({
            content: f.content,
            score: Math.round(f.score * 100) / 100,
            scope: "user" as const,
            createdAt: f.dateCreated,
          }));
      } catch (err) {
        console.error("[memory] recall failed:", err instanceof Error ? err.message : err);
        return [];
      }
    },

    async capture(who, turn) {
      const integration = scoped(who).integrate(OpenClawIntegration);
      integration.scope(who.sessionId, who.projectId).attribution(who.userId, who.projectId);
      await integration.augmentation({
        userMessage: { role: "user", content: turn.userText, type: "text" },
        agentResponse: { role: "assistant", content: turn.assistantText, type: "text" },
        metadata: { model: turn.modelId, provider: turn.modelId.split(":")[0] },
      });
    },
  };
}
