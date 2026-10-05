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
  // Supabase accepts TLS; encrypt the connection. Its certificates chain to Supabase's own CA,
  // which Node doesn't ship, so we encrypt without verifying the chain (local Postgres: no TLS).
  const ssl = /\.supabase\.(co|com)\b/.test(connectionString) ? { rejectUnauthorized: false } : undefined;
  const admin = new pg.Client({ connectionString, ssl });
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
    ssl,
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

  // Memori has no list/update/delete API, so the Memory panel works on its tables directly.
  // Every statement is scoped to the entity whose external_id is the signed-in user's id.
  // A fact belongs to a project when it was mentioned in that project's session: we use the
  // project id as Memori's session id (Memori leaves session.process_id empty in BYODB mode).
  const IN_PROJECT = `exists (
      select 1 from memori_entity_fact_mention m
      join memori_conversation c on c.id = m.conversation_id
      join memori_session s on s.id = c.session_id
      where m.entity_id = f.entity_id and m.fact_id = f.id and s.uuid = $2)`;

  return {
    name: "memori",

    async list(userId, projectId) {
      const { rows } = await pool.query<{
        uuid: string;
        content: string;
        num_times: string;
        date_created: Date;
        date_last_time: Date;
        in_project: boolean;
      }>(
        `select f.uuid, f.content, f.num_times, f.date_created, f.date_last_time, ${IN_PROJECT} as in_project
           from memori_entity_fact f
           join memori_entity e on e.id = f.entity_id
          where e.external_id = $1
          order by f.date_last_time desc
          limit 300`,
        [userId, projectId],
      );
      return rows.map((r) => ({
        id: r.uuid,
        content: r.content,
        timesSeen: Number(r.num_times),
        createdAt: r.date_created.toISOString(),
        lastSeenAt: r.date_last_time.toISOString(),
        inProject: r.in_project,
      }));
    },

    async update(userId, memoryId, content) {
      const { rowCount } = await pool.query(
        `update memori_entity_fact f set content = $3, date_updated = now()
           from memori_entity e
          where e.id = f.entity_id and e.external_id = $1 and f.uuid = $2`,
        [userId, memoryId, content],
      );
      return (rowCount ?? 0) > 0;
    },

    async remove(userId, memoryId) {
      const { rowCount } = await pool.query(
        `delete from memori_entity_fact f
          using memori_entity e
          where e.id = f.entity_id and e.external_id = $1 and f.uuid = $2`,
        [userId, memoryId],
      );
      return (rowCount ?? 0) > 0;
    },

    async forgetProject(userId, projectId) {
      // Facts mentioned in this project and nowhere else, then the project's sessions.
      const { rowCount } = await pool.query(
        `delete from memori_entity_fact f
          using memori_entity e
          where e.id = f.entity_id and e.external_id = $1
            and ${IN_PROJECT}
            and not exists (
              select 1 from memori_entity_fact_mention m
              join memori_conversation c on c.id = m.conversation_id
              join memori_session s on s.id = c.session_id
              where m.entity_id = f.entity_id and m.fact_id = f.id and s.uuid <> $2)`,
        [userId, projectId],
      );
      await pool.query(
        `delete from memori_session s
          using memori_entity e
          where s.entity_id = e.id and e.external_id = $1 and s.uuid = $2`,
        [userId, projectId],
      );
      return rowCount ?? 0;
    },

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
