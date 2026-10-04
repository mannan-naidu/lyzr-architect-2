import "server-only";

import type { RecalledMemory } from "@/lib/memory/types";

/**
 * Pluggable memory layer (ADR-004). The chat route and Memory panel depend only on this
 * interface: Memori backs it in the prototype; Lyzr Cognis is the production option.
 */
export type MemoryAttribution = {
  /** Auth user id: builder memory follows the user across projects. */
  userId: string;
  /** Project id: recorded as Memori's `process`; also used for the decision log. */
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
}

/** Used when memory is off for a project or no memory backend is configured. */
export const noopMemory: MemoryProvider = {
  name: "none",
  async recall() {
    return [];
  },
  async capture() {},
};

let provider: Promise<MemoryProvider | null> | undefined;

/**
 * The configured provider, or null if none is available (no DATABASE_URL). Created once per
 * server process: Memori's native engine and embedding model are expensive to load.
 */
export function getMemoryProvider(): Promise<MemoryProvider | null> {
  if (!provider) {
    provider = (async () => {
      if (!process.env.DATABASE_URL) return null;
      const { createMemoriProvider } = await import("@/lib/memory/memori.server");
      return createMemoriProvider(process.env.DATABASE_URL);
    })().catch((err: unknown) => {
      console.error("[memory] provider init failed:", err instanceof Error ? err.message : err);
      provider = undefined; // retry on the next request
      return null;
    });
  }
  return provider;
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
