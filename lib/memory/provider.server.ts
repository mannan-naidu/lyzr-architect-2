import "server-only";

import type { RecalledMemory, StoredMemory } from "@/lib/memory/types";

/**
 * Pluggable memory layer (ADR-004). The chat route and Memory panel depend only on this
 * interface. It's backed by Lyzr Cognis (open source) running as a separate service (ADR-006).
 */
export type MemoryAttribution = {
  /** Auth user id: builder memory follows the user across projects. */
  userId: string;
  /** Project id: Cognis's `session_id`, so we know where a fact was learned. */
  projectId: string;
  /** Chat thread id (one per project for now). */
  sessionId: string;
};

export type ConversationTurn = {
  userText: string;
  assistantText: string;
  modelId: string;
};

export interface MemoryProvider {
  readonly name: string;
  /** Relevant memories for this query, best first. Never throws: returns [] on failure. */
  recall(who: MemoryAttribution, query: string): Promise<RecalledMemory[]>;
  /** Hand a finished turn to the provider for fact extraction. Resolves when queued. */
  capture(who: MemoryAttribution, turn: ConversationTurn): Promise<void>;

  // ── Memory panel (transparency + control). Always scoped to `userId`. ──────────────────
  /** Everything remembered about this user; `inProject` marks facts learned in `projectId`. */
  list(userId: string, projectId: string): Promise<StoredMemory[]>;
  update(userId: string, memoryId: string, content: string): Promise<boolean>;
  remove(userId: string, memoryId: string): Promise<boolean>;
  /** Forget what was learned only in this project (facts also seen elsewhere are kept). */
  forgetProject(userId: string, projectId: string): Promise<number>;
}

/** Used when memory is off for a project or no memory backend is configured. */
export const noopMemory: MemoryProvider = {
  name: "none",
  async recall() {
    return [];
  },
  async capture() {},
  async list() {
    return [];
  },
  async update() {
    return false;
  },
  async remove() {
    return false;
  },
  async forgetProject() {
    return 0;
  },
};


/** Why memory is or isn't available, for the Memory tab and /api/health. Never includes secrets. */
export async function getMemoryStatus(): Promise<
  { status: "ok"; backend: string } | { status: "not_configured" } | { status: "error"; error: string }
> {
  const url = process.env.MEMORY_SERVICE_URL;
  if (!url || !process.env.MEMORY_SERVICE_TOKEN) return { status: "not_configured" };
  const { pingCognis } = await import("@/lib/memory/cognis.server");
  if (!(await pingCognis(url))) return { status: "error", error: "The memory service isn't responding." };
  return { status: "ok", backend: "cognis" };
}

/**
 * The memory provider, or null when the memory service isn't configured
 * (MEMORY_SERVICE_URL + MEMORY_SERVICE_TOKEN). It's a thin HTTP client, so creating it is cheap.
 */
export async function getMemoryProvider(): Promise<MemoryProvider | null> {
  const url = process.env.MEMORY_SERVICE_URL?.trim();
  const token = process.env.MEMORY_SERVICE_TOKEN?.trim();
  if (!url || !token) return null;
  const { createCognisProvider } = await import("@/lib/memory/cognis.server");
  return createCognisProvider(url, token);
}

/** Build the instruction block injected before the model call. */
export function formatMemoryContext(memories: RecalledMemory[]): string | null {
  if (!memories.length) return null;
  const lines = memories.map((m) => `- ${m.content}${m.createdAt ? ` (noted ${m.createdAt})` : ""}`);
  return [
    "What you remember about this user from earlier sessions (use it only when relevant;",
    "if it conflicts with what they say now, follow what they say now):",
    ...lines,
  ].join("\n");
}
