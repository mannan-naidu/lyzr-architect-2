import "server-only";

import type { RecalledMemory, StoredMemory } from "@/lib/memory/types";

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

let provider: Promise<MemoryProvider | null> | undefined;
let lastInitError: string | null = null;

/** An error's message plus its causes (native loaders attach the real load errors as `cause`). */
function errorChain(err: unknown, depth = 0): string {
  if (depth > 3 || err == null) return "";
  if (Array.isArray(err)) return err.map((e) => errorChain(e, depth + 1)).filter(Boolean).join(" | ");
  if (err instanceof Error) {
    const cause = errorChain((err as Error & { cause?: unknown }).cause, depth + 1);
    return cause ? `${err.message} <- ${cause}` : err.message;
  }
  return String(err);
}

/** Strip anything that looks like a connection string or credential from an error message. */
function scrub(message: string): string {
  return message.replace(/postgres(ql)?:\/\/[^\s"']+/gi, "postgres://***").slice(0, 1200);
}

/** Why memory is or isn't available, for the Memory tab and /api/health. Never includes secrets. */
/** Which backend to use: MEMORY_PROVIDER=postgres (default) | memori | none. */
function backend(): "postgres" | "memori" | "none" {
  const v = process.env.MEMORY_PROVIDER?.trim().toLowerCase();
  return v === "memori" || v === "none" ? v : "postgres";
}

/** Why memory is or isn't available, for the Memory tab and /api/health. Never includes secrets. */
export async function getMemoryStatus(): Promise<
  { status: "ok"; backend: string } | { status: "not_configured" } | { status: "error"; error: string }
> {
  const which = backend();
  if (which === "none") return { status: "not_configured" };
  if (which === "memori" && !process.env.DATABASE_URL) return { status: "not_configured" };
  if (which === "postgres" && !process.env.SUPABASE_SERVICE_ROLE_KEY) return { status: "not_configured" };
  const p = await getMemoryProvider();
  if (p) return { status: "ok", backend: p.name };
  return { status: "error", error: lastInitError ?? "Memory failed to start." };
}

/**
 * The configured provider, or null if none is available. Created once per server process.
 * - postgres (default): facts in Supabase Postgres; works on serverless (ADR-006).
 * - memori: Memori BYODB; needs a host with glibc >= 2.38 for its native engine (ADR-003).
 */
export function getMemoryProvider(): Promise<MemoryProvider | null> {
  if (!provider) {
    provider = (async () => {
      const which = backend();
      if (which === "none") return null;
      if (which === "postgres") {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
        const { createPostgresMemoryProvider } = await import("@/lib/memory/postgres.server");
        const created = createPostgresMemoryProvider();
        lastInitError = null;
        return created;
      }
      if (!process.env.DATABASE_URL) return null;
      // Memori's engine downloads its embedding model (~87 MB) to ./.fastembed_cache. Serverless
      // filesystems are read-only except /tmp, so point the cache there (kept while the instance is warm).
      if (process.env.VERCEL && !process.env.FASTEMBED_CACHE_DIR) {
        process.env.FASTEMBED_CACHE_DIR = "/tmp/fastembed_cache";
      }
      const { createMemoriProvider } = await import("@/lib/memory/memori.server");
      const created = await createMemoriProvider(process.env.DATABASE_URL);
      lastInitError = null;
      return created;
    })().catch((err: unknown) => {
      lastInitError = scrub(errorChain(err));
      console.error("[memory] provider init failed:", lastInitError);
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
