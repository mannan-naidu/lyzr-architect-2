"use client";

import {
  AlertTriangleIcon,
  BrainIcon,
  ClipboardListIcon,
  FileCodeIcon,
  RefreshCwIcon,
  RocketIcon,
  ShieldCheckIcon,
  TerminalIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { RunEvent, RunEventKind } from "@/lib/types/database";
import { cn } from "@/lib/utils";

import { useWorkspace } from "../workspace-context";

const KIND: Record<RunEventKind, { icon: LucideIcon; tone: string }> = {
  plan: { icon: ClipboardListIcon, tone: "text-primary" },
  recall: { icon: BrainIcon, tone: "text-primary" },
  tool: { icon: TerminalIcon, tone: "text-muted-foreground" },
  file: { icon: FileCodeIcon, tone: "text-muted-foreground" },
  error: { icon: AlertTriangleIcon, tone: "text-destructive" },
  fix: { icon: WrenchIcon, tone: "text-[var(--yellow)]" },
  deploy: { icon: RocketIcon, tone: "text-[var(--green)]" },
  log: { icon: TerminalIcon, tone: "text-muted-foreground" },
  check: { icon: ShieldCheckIcon, tone: "text-[var(--green)]" },
};

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour12: false });

function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="xs" onClick={() => start(() => router.refresh())} disabled={pending}>
      <RefreshCwIcon className={cn(pending && "animate-spin")} /> Refresh
    </Button>
  );
}

function detailText(detail: RunEvent["detail"]): string | null {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return null;
  const entries = Object.entries(detail).filter(([k, v]) => k !== "before" && v !== null && v !== undefined);
  if (!entries.length) return null;
  return entries
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("  ")
    .slice(0, 400);
}

/** Pro mode: a terminal-style log of everything the agent did, newest last. */
export function LogsPanel() {
  const { events } = useWorkspace();
  const [filter, setFilter] = useState<RunEventKind | "all">("all");
  const kinds = useMemo(() => [...new Set(events.map((e) => e.kind))], [events]);
  const shown = [...events].reverse().filter((e) => filter === "all" || e.kind === filter);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
        <Button size="xs" variant={filter === "all" ? "secondary" : "ghost"} onClick={() => setFilter("all")}>
          all · {events.length}
        </Button>
        {kinds.map((k) => (
          <Button key={k} size="xs" variant={filter === k ? "secondary" : "ghost"} onClick={() => setFilter(k)}>
            {k}
          </Button>
        ))}
        <span className="ml-auto">
          <RefreshButton />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[oklch(0.18_0.01_188)] p-3 font-mono text-xs leading-5 text-[oklch(0.85_0.01_90)]">
        {shown.length === 0 ? (
          <p className="text-muted-foreground">$ waiting for the first run… (generate a plan to start)</p>
        ) : (
          shown.map((e) => {
            const extra = detailText(e.detail);
            return (
              <div key={e.id}>
                <span className="text-muted-foreground">{time(e.created_at)} </span>
                <span className={cn("inline-block w-14", KIND[e.kind].tone)}>[{e.kind}]</span> {e.title}
                {e.tokens_in || e.tokens_out ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {(e.tokens_in ?? 0).toLocaleString()} in / {(e.tokens_out ?? 0).toLocaleString()} out
                  </span>
                ) : null}
                {extra ? <div className="pl-[5.5rem] text-muted-foreground">{extra}</div> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/** Pro mode: the agent trace, one timeline per run (plan, build, fix, deploy). */
export function TracePanel() {
  const { events } = useWorkspace();
  const runs = useMemo(() => {
    const map = new Map<string, RunEvent[]>();
    for (const e of [...events].reverse()) map.set(e.run_id, [...(map.get(e.run_id) ?? []), e]);
    return [...map.entries()].reverse();
  }, [events]);

  if (!runs.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <TerminalIcon className="size-8" /> No runs yet. Every plan, build, fix and deploy is traced here.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <span className="label-mono text-muted-foreground">{runs.length} runs · newest first</span>
        <RefreshButton />
      </div>
      {runs.map(([runId, steps]) => {
        const start = new Date(steps[0]!.created_at).getTime();
        const end = new Date(steps[steps.length - 1]!.created_at).getTime();
        const tokens = steps.reduce((n, s) => n + (s.tokens_in ?? 0) + (s.tokens_out ?? 0), 0);
        const failed = steps.some((s) => s.kind === "error");
        return (
          <div key={runId} className="border">
            <div className="flex flex-wrap items-center gap-3 border-b bg-muted/40 px-3 py-2">
              <span className={cn("size-1.5 rounded-full", failed ? "bg-destructive" : "bg-[var(--green)]")} />
              <span className="text-sm font-medium">{steps[0]!.title}</span>
              <span className="label-mono ml-auto text-muted-foreground">
                run {runId.slice(0, 8)} · {((end - start) / 1000).toFixed(1)}s · {tokens.toLocaleString()} tokens
              </span>
            </div>
            <ol className="relative space-y-0 py-2">
              {steps.map((s) => {
                const { icon: Icon, tone } = KIND[s.kind];
                const offset = ((new Date(s.created_at).getTime() - start) / 1000).toFixed(1);
                return (
                  <li key={s.id} className="flex items-start gap-3 px-3 py-1 text-sm">
                    <span className="label-mono w-12 shrink-0 text-right text-muted-foreground">+{offset}s</span>
                    <Icon className={cn("mt-0.5 size-3.5 shrink-0", tone)} />
                    <span className="min-w-0 flex-1">
                      {s.title}
                      {detailText(s.detail) ? (
                        <span className="block truncate font-mono text-xs text-muted-foreground">{detailText(s.detail)}</span>
                      ) : null}
                    </span>
                    {s.tokens_in || s.tokens_out ? (
                      <span className="label-mono shrink-0 text-muted-foreground">
                        {((s.tokens_in ?? 0) + (s.tokens_out ?? 0)).toLocaleString()} tok
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
