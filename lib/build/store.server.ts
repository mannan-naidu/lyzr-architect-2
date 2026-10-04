import "server-only";

import type { GuardedProject } from "@/lib/build/guard.server";
import type { Json, RunEventKind } from "@/lib/types/database";

type Supabase = GuardedProject["supabase"];

/** Upsert generated files, keeping each file's previous contents for Pro-mode diffs. */
export async function saveFiles(
  supabase: Supabase,
  projectId: string,
  files: ReadonlyArray<{ path: string; content: string }>,
  updatedBy: "agent" | "user" = "agent",
) {
  if (!files.length) return;
  const { data: existing } = await supabase
    .from("project_files")
    .select("path, content")
    .eq("project_id", projectId);
  const before = new Map((existing ?? []).map((f) => [f.path, f.content]));

  const rows = files.map((f) => ({
    project_id: projectId,
    path: normalizePath(f.path),
    content: f.content,
    previous_content: before.get(normalizePath(f.path)) ?? null,
    updated_by: updatedBy,
  }));
  const { error } = await supabase.from("project_files").upsert(rows, { onConflict: "project_id,path" });
  if (error) throw new Error(`Saving files failed: ${error.message}`);
}

export function normalizePath(path: string): string {
  const p = path.trim().replace(/^\.?\/*/, "/");
  return p.length > 1 ? p : "/App.tsx";
}

/** Append a trace / log event. Never throws: tracing must not break the run. */
export async function logEvent(
  supabase: Supabase,
  event: {
    projectId: string;
    runId: string;
    kind: RunEventKind;
    title: string;
    detail?: Json;
    tokensIn?: number;
    tokensOut?: number;
  },
) {
  const { error } = await supabase.from("run_events").insert({
    project_id: event.projectId,
    run_id: event.runId,
    kind: event.kind,
    title: event.title,
    detail: event.detail ?? {},
    tokens_in: event.tokensIn ?? null,
    tokens_out: event.tokensOut ?? null,
  });
  if (error) console.error("[trace] insert failed:", error.message);
}

/** Record a model call in the messages ledger (tokens + who pays). */
export async function recordUsage(
  supabase: Supabase,
  row: {
    projectId: string;
    kind: "plan" | "build" | "fix";
    content: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    billedTo: "user" | "agent";
  },
) {
  await supabase.from("messages").insert({
    project_id: row.projectId,
    role: "assistant",
    content: row.content,
    model: row.modelId,
    tokens_in: row.inputTokens,
    tokens_out: row.outputTokens,
    billed_to: row.billedTo,
    kind: row.kind,
  });
}
