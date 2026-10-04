"use client";

import {
  BrainIcon,
  CheckIcon,
  HistoryIcon,
  ListChecksIcon,
  LoaderIcon,
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  RefreshCwIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { SwitchToggle } from "@/components/switch-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StoredMemory } from "@/lib/memory/types";
import { estimateCostUsd, findModel } from "@/lib/models";
import type { FixAttempt } from "@/lib/types/database";
import { cn } from "@/lib/utils";

import { addDecision, deleteDecision, setProjectFlags } from "../actions";
import { deleteMemory, forgetProjectMemory, listMemories, updateMemory } from "../memory-actions";
import { useWorkspace, type LedgerRow } from "../workspace-context";

type View = "memories" | "decisions" | "fixes" | "ledger";

/**
 * Visible memory: everything Architect remembers about the user, editable and deletable, plus
 * the project's decision log and fix history. Nothing the agent "knows" is hidden from the user.
 */
export function MemoryPanel() {
  const { project, decisions, fixes, ledger } = useWorkspace();
  const [view, setView] = useState<View>("memories");
  const [enabled, setEnabledOptimistic] = useOptimistic(project.memory_enabled);
  const [, startToggle] = useTransition();

  const toggle = (next: boolean) =>
    startToggle(async () => {
      setEnabledOptimistic(next);
      const result = await setProjectFlags({ projectId: project.id, memory_enabled: next });
      if ("error" in result) toast.error(result.error);
      else toast.success(next ? "Memory on for this project" : "Memory paused for this project");
    });

  const views: { value: View; label: string; icon: typeof BrainIcon; count?: number }[] = [
    { value: "memories", label: "What I remember", icon: BrainIcon },
    { value: "decisions", label: "Decision log", icon: ListChecksIcon, count: decisions.length },
    { value: "fixes", label: "Fix history", icon: HistoryIcon, count: fixes.length },
    { value: "ledger", label: "Billing ledger", icon: ReceiptIcon },
  ];

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl space-y-1">
          <span className="label-mono text-primary">Builder memory</span>
          <h2 className="text-xl font-semibold">What Architect remembers</h2>
          <p className="text-sm text-muted-foreground">
            Your preferences, project decisions and past fixes, learned from your sessions. It follows you
            across projects so you never repeat yourself. Edit or delete anything.
          </p>
        </div>
        <label className="flex items-center gap-3 border bg-card px-3 py-2 text-sm">
          <SwitchToggle checked={enabled} onCheckedChange={toggle} label="Memory for this project" />
          <span>
            <span className="block font-medium">{enabled ? "Memory on" : "Memory paused"}</span>
            <span className="text-xs text-muted-foreground">for this project</span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-1 border-b pb-2">
        {views.map(({ value, label, icon: Icon, count }) => (
          <Button key={value} variant={view === value ? "secondary" : "ghost"} size="sm" onClick={() => setView(value)}>
            <Icon className="size-3.5" />
            {label}
            {count ? <span className="label-mono text-muted-foreground">{count}</span> : null}
          </Button>
        ))}
      </div>

      {view === "memories" ? (
        <MemoryList />
      ) : view === "decisions" ? (
        <DecisionLog />
      ) : view === "fixes" ? (
        <FixHistory fixes={fixes} />
      ) : (
        <Ledger rows={ledger} />
      )}
    </div>
  );
}

function MemoryList() {
  const { project } = useWorkspace();
  const [state, setState] = useState<
    { phase: "loading" } | { phase: "error"; message: string } | { phase: "ready"; memories: StoredMemory[]; backend: string }
  >({ phase: "loading" });
  const [scope, setScope] = useState<"project" | "all">("all");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [busy, startBusy] = useTransition();

  const load = useCallback(async () => {
    const result = await listMemories({ projectId: project.id });
    setState("error" in result ? { phase: "error", message: result.error } : { phase: "ready", ...result });
  }, [project.id]);

  useEffect(() => {
    let live = true;
    void listMemories({ projectId: project.id }).then((result) => {
      if (live) setState("error" in result ? { phase: "error", message: result.error } : { phase: "ready", ...result });
    });
    return () => {
      live = false;
    };
  }, [project.id]);

  const run = (fn: () => Promise<{ error: string } | object>, success: string) =>
    startBusy(async () => {
      const result = await fn();
      if ("error" in result && typeof result.error === "string") toast.error(result.error);
      else toast.success(success);
      setEditing(null);
      await load();
    });

  if (state.phase === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderIcon className="size-4 animate-spin" /> Loading memories…
      </p>
    );
  }
  if (state.phase === "error") return <p className="text-sm text-destructive">{state.message}</p>;
  if (state.backend === "none") {
    return (
      <EmptyNote>
        No memory backend is configured on this deployment (set <code>DATABASE_URL</code> to enable Memori).
      </EmptyNote>
    );
  }

  const shown = scope === "project" ? state.memories.filter((m) => m.inProject) : state.memories;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <Button variant={scope === "all" ? "secondary" : "ghost"} size="xs" onClick={() => setScope("all")}>
            Everywhere · {state.memories.length}
          </Button>
          <Button variant={scope === "project" ? "secondary" : "ghost"} size="xs" onClick={() => setScope("project")}>
            Learned here · {state.memories.filter((m) => m.inProject).length}
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={() => void load()} disabled={busy}>
            <RefreshCwIcon /> Refresh
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-destructive"
            disabled={busy || !state.memories.some((m) => m.inProject)}
            onClick={() => {
              if (!window.confirm("Forget everything learned only in this project? Facts also seen in other projects are kept."))
                return;
              run(() => forgetProjectMemory({ projectId: project.id }), "Forgot this project's memories");
            }}
          >
            <Trash2Icon /> Forget this project
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyNote>
          Nothing remembered yet. Chat about how you like to build (&ldquo;I deploy on Vercel&rdquo;, &ldquo;keep it
          minimal&rdquo;) and Architect will remember it in every project. Facts are extracted a few seconds after each
          reply.
        </EmptyNote>
      ) : (
        <ul className="divide-y border">
          {shown.map((m) => (
            <li key={m.id} className="flex items-start gap-3 p-3">
              <BrainIcon className={cn("mt-0.5 size-4 shrink-0", m.inProject ? "text-primary" : "text-muted-foreground")} />
              <div className="min-w-0 flex-1">
                {editing?.id === m.id ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(() => updateMemory({ projectId: project.id, memoryId: m.id, content: editing.text }), "Memory updated");
                    }}
                  >
                    <Input
                      value={editing.text}
                      onChange={(e) => setEditing({ id: m.id, text: e.target.value })}
                      aria-label="Memory text"
                      autoFocus
                    />
                    <Button size="icon-sm" type="submit" disabled={busy} aria-label="Save">
                      <CheckIcon />
                    </Button>
                    <Button size="icon-sm" variant="ghost" type="button" onClick={() => setEditing(null)} aria-label="Cancel">
                      <XIcon />
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm">{m.content}</p>
                )}
                <p className="label-mono mt-1 text-muted-foreground">
                  {m.inProject ? "learned in this project" : "from another project"} · seen {m.timesSeen}× · last{" "}
                  {new Date(m.lastSeenAt).toLocaleDateString()}
                </p>
              </div>
              {editing?.id === m.id ? null : (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Edit memory"
                    onClick={() => setEditing({ id: m.id, text: m.content })}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Delete memory"
                    disabled={busy}
                    onClick={() => run(() => deleteMemory({ projectId: project.id, memoryId: m.id }), "Memory deleted")}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="label-mono text-muted-foreground">Backend: {state.backend} · Postgres · scoped to your account</p>
    </div>
  );
}

const SOURCE_LABEL = { plan: "from the plan", chat: "from chat", user: "added by you", fix: "from a fix" } as const;

function DecisionLog() {
  const { project, decisions } = useWorkspace();
  const [text, setText] = useState("");
  const [busy, startBusy] = useTransition();

  const add = () =>
    startBusy(async () => {
      const result = await addDecision({ projectId: project.id, text });
      if ("error" in result) toast.error(result.error);
      else setText("");
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Decisions are injected into every build, fix and chat turn, so Architect never re-litigates what you already
        settled.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) add();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Never use a database for v1"
          aria-label="New decision"
          maxLength={500}
        />
        <Button type="submit" disabled={busy || !text.trim()}>
          <PlusIcon /> Add
        </Button>
      </form>
      {decisions.length === 0 ? (
        <EmptyNote>No decisions yet. Approving a plan records its decisions here.</EmptyNote>
      ) : (
        <ul className="divide-y border">
          {decisions.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-3">
              <CheckIcon className="size-4 shrink-0 text-[var(--green)]" />
              <span className="flex-1 text-sm">{d.text}</span>
              <span className="label-mono hidden text-muted-foreground sm:inline">{SOURCE_LABEL[d.source]}</span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Remove decision"
                disabled={busy}
                onClick={() =>
                  startBusy(async () => {
                    const result = await deleteDecision({ projectId: project.id, decisionId: d.id });
                    if ("error" in result) toast.error(result.error);
                  })
                }
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const OUTCOME_STYLE: Record<FixAttempt["outcome"], string> = {
  pending: "text-muted-foreground",
  succeeded: "text-[var(--green)]",
  failed: "text-destructive",
  rolled_back: "text-[var(--yellow)]",
};

function FixHistory({ fixes }: { fixes: FixAttempt[] }) {
  if (!fixes.length) {
    return (
      <EmptyNote>
        No fixes yet. When the preview breaks, &ldquo;Fix it&rdquo; is free, and every fix that works is remembered so the
        same error is fixed instantly next time, in any of your projects.
      </EmptyNote>
    );
  }
  const saved = fixes.reduce((n, f) => n + f.tokens, 0);
  const groups = new Map<string, FixAttempt[]>();
  for (const f of fixes) groups.set(f.error_signature, [...(groups.get(f.error_signature) ?? []), f]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {fixes.length} fix attempt{fixes.length === 1 ? "" : "s"} · {saved.toLocaleString()} tokens spent by the agent,{" "}
        <span className="text-foreground">billed to Architect, not you</span>.
      </p>
      {[...groups.entries()].map(([signature, attempts]) => (
        <div key={signature} className="border">
          <div className="border-b bg-muted/40 px-3 py-2">
            <span className="label-mono text-muted-foreground">error {signature.slice(0, 8)}</span>
            <p className="line-clamp-2 font-mono text-xs">{attempts[0]?.error_message}</p>
          </div>
          <ol className="divide-y">
            {[...attempts].reverse().map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                <span className="label-mono w-16 shrink-0 text-muted-foreground">try {a.attempt}</span>
                <span className="flex-1">{a.fix_summary}</span>
                <span className={cn("label-mono shrink-0", OUTCOME_STYLE[a.outcome])}>{a.outcome.replace("_", " ")}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function Ledger({ rows }: { rows: LedgerRow[] }) {
  if (!rows.length) return <EmptyNote>No model calls yet. Every plan, build, fix and chat turn is itemised here.</EmptyNote>;
  const cost = (r: LedgerRow) => {
    const model = r.model ? findModel(r.model) : undefined;
    return (model && estimateCostUsd(model, { inputTokens: r.tokens_in ?? 0, outputTokens: r.tokens_out ?? 0 })) ?? 0;
  };
  const tokens = (r: LedgerRow) => (r.tokens_in ?? 0) + (r.tokens_out ?? 0);
  const yours = rows.filter((r) => r.billed_to === "user");
  const ours = rows.filter((r) => r.billed_to === "agent");
  const sum = (list: LedgerRow[], f: (r: LedgerRow) => number) => list.reduce((n, r) => n + f(r), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="border p-3">
          <span className="label-mono text-muted-foreground">Billed to you</span>
          <p className="text-lg font-semibold">${sum(yours, cost).toFixed(4)}</p>
          <p className="text-xs text-muted-foreground">{sum(yours, tokens).toLocaleString()} tokens · your requests</p>
        </div>
        <div className="border border-[var(--green)]/50 p-3">
          <span className="label-mono text-[var(--green)]">Absorbed by Architect</span>
          <p className="text-lg font-semibold">${sum(ours, cost).toFixed(4)}</p>
          <p className="text-xs text-muted-foreground">{sum(ours, tokens).toLocaleString()} tokens · the agent fixing its own mistakes</p>
        </div>
      </div>
      <table className="w-full border text-sm">
        <thead className="label-mono text-left text-muted-foreground">
          <tr className="border-b">
            <th className="p-2 font-normal">When</th>
            <th className="p-2 font-normal">What</th>
            <th className="hidden p-2 font-normal sm:table-cell">Model</th>
            <th className="p-2 text-right font-normal">Tokens</th>
            <th className="p-2 text-right font-normal">Paid by</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="p-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
              <td className="p-2">{r.kind}</td>
              <td className="hidden p-2 font-mono text-xs sm:table-cell">{r.model?.split(":")[1] ?? r.model ?? "–"}</td>
              <td className="p-2 text-right font-mono text-xs">{tokens(r).toLocaleString()}</td>
              <td className={cn("label-mono p-2 text-right", r.billed_to === "agent" ? "text-[var(--green)]" : "text-muted-foreground")}>
                {r.billed_to === "agent" ? "Architect" : "you"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed p-4 text-sm text-muted-foreground">{children}</p>;
}
