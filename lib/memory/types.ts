// Client-safe memory types: shared by the chat stream (data parts) and the UI.

/** Where a memory applies. Builder memory is per user across projects (ADR-005). */
export type MemoryScope = "user" | "project" | "agent";

export type RecalledMemory = {
  content: string;
  /** Relevance 0..1 from the provider. */
  score: number;
  scope: MemoryScope;
  createdAt?: string;
};

/** Streamed as a `data-memory` part on every assistant message (the recall dropdown). */
export type MemoryPartData =
  | { status: "off"; reason: "disabled" | "unavailable" }
  | { status: "recalling" }
  | { status: "recalled"; recalled: RecalledMemory[]; captured: "pending" | "saved" | "failed" };

/** Streamed as a `data-usage` part when the turn ends (fair-billing ledger). */
export type UsagePartData = {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  /** null when the model's price isn't known. */
  costUsd: number | null;
  /** Who this turn is billed to: the user's request vs an agent self-fix (free). */
  billedTo: "user" | "agent-self-fix";
};

/** A stored memory as shown in the Memory panel. */
export type StoredMemory = {
  id: string;
  content: string;
  /** How many times this fact was observed / reinforced. */
  timesSeen: number;
  createdAt: string;
  lastSeenAt: string;
  /** Learned (at least partly) in the current project. */
  inProject: boolean;
};
