import "server-only";

import type { MemoryProvider } from "@/lib/memory/provider.server";
import type { RecalledMemory, StoredMemory } from "@/lib/memory/types";

/**
 * Builder memory backed by Lyzr Cognis (open source), running as a separate service: Docker on
 * AWS EC2 (memory-service/). Cognis keeps a vector + BM25 index in local files, which needs a
 * persistent disk and a long-lived process that Vercel functions don't have (ADR-006).
 *
 * Scoping in the service: owner = user, agent = "architect-builder", session = project.
 */

type ServiceMemory = {
  id: string;
  content: string;
  category: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  in_project: boolean;
  score?: number;
};

/** Below this, a recalled memory is too weak to have influenced the turn. */
const MIN_SCORE = 0.05;

export function createCognisProvider(baseUrl: string, token: string): MemoryProvider {
  const base = baseUrl.replace(/\/+$/, "");

  async function call<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
    const { timeoutMs = 8000, ...rest } = init;
    const res = await fetch(`${base}${path}`, {
      ...rest,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...rest.headers },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (res.status === 404) throw Object.assign(new Error("not found"), { notFound: true });
    if (!res.ok) throw new Error(`memory service ${res.status}`);
    return (await res.json()) as T;
  }

  const toStored = (m: ServiceMemory): StoredMemory => ({
    id: m.id,
    content: m.content,
    category: m.category,
    version: m.version,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    inProject: m.in_project,
  });

  return {
    name: "cognis",

    async recall(who, query) {
      try {
        const { memories } = await call<{ memories: ServiceMemory[] }>("/v1/recall", {
          method: "POST",
          body: JSON.stringify({ user_id: who.userId, project_id: who.projectId, query: query.slice(0, 4000), limit: 6 }),
          timeoutMs: 5000,
        });
        return memories
          .filter((m) => (m.score ?? 0) >= MIN_SCORE)
          .map<RecalledMemory>((m) => ({
            content: m.content,
            score: Math.min(1, m.score ?? 0),
            scope: "user",
            createdAt: m.created_at,
          }));
      } catch (err) {
        console.error("[memory] recall failed:", err instanceof Error ? err.message : err);
        return [];
      }
    },

    async capture(who, turn) {
      // The service queues extraction and answers immediately (202).
      await call("/v1/capture", {
        method: "POST",
        body: JSON.stringify({
          user_id: who.userId,
          project_id: who.projectId,
          user_text: turn.userText.slice(0, 8000),
          assistant_text: turn.assistantText.slice(0, 8000),
        }),
        timeoutMs: 5000,
      });
    },

    async list(userId, projectId) {
      const params = new URLSearchParams({ user_id: userId, project_id: projectId });
      const { memories } = await call<{ memories: ServiceMemory[] }>(`/v1/memories?${params}`);
      return memories.map(toStored);
    },

    async update(userId, memoryId, content) {
      try {
        await call(`/v1/memories/${encodeURIComponent(memoryId)}`, {
          method: "PATCH",
          body: JSON.stringify({ user_id: userId, content }),
          timeoutMs: 15000,
        });
        return true;
      } catch (err) {
        if ((err as { notFound?: boolean }).notFound) return false;
        throw err;
      }
    },

    async remove(userId, memoryId) {
      try {
        await call(`/v1/memories/${encodeURIComponent(memoryId)}?${new URLSearchParams({ user_id: userId })}`, {
          method: "DELETE",
        });
        return true;
      } catch (err) {
        if ((err as { notFound?: boolean }).notFound) return false;
        throw err;
      }
    },

    async forgetProject(userId, projectId) {
      const { removed } = await call<{ removed: number }>("/v1/forget-project", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, project_id: projectId }),
        timeoutMs: 15000,
      });
      return removed;
    },
  };
}

/** Liveness of the memory service, for /api/health. */
export async function pingCognis(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/health`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
