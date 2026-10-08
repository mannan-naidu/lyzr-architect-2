"use client";

import { ArrowRightIcon, BotIcon, BrainIcon, CopyIcon, UserIcon, WrenchIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { SwitchToggle } from "@/components/switch-toggle";
import { Button } from "@/components/ui/button";
import { generateAgentCode } from "@/lib/agents/codegen";
import type { PlannedAgent } from "@/lib/build/schemas";
import { AGENT_FRAMEWORKS, FRAMEWORK_LABELS, type AgentFramework } from "@/lib/types/database";
import { cn } from "@/lib/utils";

import { setAgentMemory, setFramework } from "../actions";
import { useWorkspace } from "../workspace-context";

/** Columns of the agent graph: entry agents first, then whoever they hand off to. */
function layers(agents: readonly PlannedAgent[]): PlannedAgent[][] {
  const byName = new Map(agents.map((a) => [a.name, a]));
  const depth = new Map<string, number>();
  const entries = agents.filter((a) => !agents.some((b) => b.handsOffTo.includes(a.name)));
  const queue = (entries.length ? entries : agents.slice(0, 1)).map((a) => ({ a, d: 0 }));
  while (queue.length) {
    const { a, d } = queue.shift()!;
    if (depth.has(a.name)) continue;
    depth.set(a.name, d);
    for (const next of a.handsOffTo) {
      const n = byName.get(next);
      if (n && !depth.has(n.name)) queue.push({ a: n, d: d + 1 });
    }
  }
  for (const a of agents) if (!depth.has(a.name)) depth.set(a.name, 0);
  const cols: PlannedAgent[][] = [];
  for (const a of agents) (cols[depth.get(a.name) ?? 0] ??= []).push(a);
  return cols.filter(Boolean);
}

export function AgentsPanel({ pro }: { pro: boolean }) {
  const { project, plan, planStatus, setPlan, setActiveTab } = useWorkspace();
  const [framework, setFrameworkState] = useState<AgentFramework>(project.framework as AgentFramework);
  const [busy, startBusy] = useTransition();
  const agents = useMemo(() => plan?.agents ?? [], [plan]);
  const code = useMemo(
    () => generateAgentCode(framework, agents, plan?.title ?? project.name),
    [framework, agents, plan?.title, project.name],
  );

  if (!plan || !agents.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
        <BotIcon className="size-8" />
        Your agents appear here once the plan is drafted.
        <Button size="sm" variant="outline" onClick={() => setActiveTab("plan")}>
          Go to the plan
        </Button>
      </div>
    );
  }

  const toggleMemory = (agent: PlannedAgent, memory: boolean) =>
    startBusy(async () => {
      const result = await setAgentMemory({ projectId: project.id, agentName: agent.name, memory });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPlan(result.plan, planStatus);
      toast.success(`${agent.name} ${memory ? "now remembers" : "no longer remembers"} its users`);
    });

  const chooseFramework = (f: AgentFramework) =>
    startBusy(async () => {
      setFrameworkState(f);
      const result = await setFramework({ projectId: project.id, framework: f });
      if ("error" in result) toast.error(result.error);
    });

  const cols = layers(agents);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <span className="label-mono text-primary">Agents</span>
        <h2 className="text-xl font-semibold">The agents behind {plan.title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          One spec, any framework. Turn on memory for an agent and it remembers each of your end users across sessions
          (Lyzr Cognis, the same engine as Architect's own memory).
        </p>
      </div>

      {/* Graph */}
      <div className="overflow-x-auto border bg-card/40 p-4">
        <div className="flex min-w-max items-center gap-3">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <UserIcon className="size-5" />
            <span className="label-mono">user</span>
          </div>
          {cols.map((col, i) => (
            <div key={i} className="flex items-center gap-3">
              <ArrowRightIcon className="size-4 text-muted-foreground" />
              <div className="flex flex-col gap-2">
                {col.map((a) => (
                  <div key={a.name} className="chamfer-sm w-48 border bg-background p-2">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <BotIcon className="size-3.5 text-primary" />
                      <span className="truncate">{a.name}</span>
                      {a.memory ? <BrainIcon className="ml-auto size-3.5 text-primary" aria-label="Memory on" /> : null}
                    </p>
                    {a.handsOffTo.length ? (
                      <p className="label-mono mt-1 truncate text-muted-foreground">→ {a.handsOffTo.join(", ")}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-3 lg:grid-cols-2">
        {agents.map((a) => (
          <div key={a.name} className="space-y-3 border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-sm text-muted-foreground">{a.role}</p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs">
                <BrainIcon className="size-3.5" /> Memory
                <SwitchToggle
                  checked={a.memory}
                  disabled={busy}
                  onCheckedChange={(next) => toggleMemory(a, next)}
                  label={`Memory for ${a.name}`}
                />
              </label>
            </div>
            {pro ? <p className="border-l-2 pl-3 text-xs text-muted-foreground">{a.instructions}</p> : null}
            <div className="flex flex-wrap gap-1">
              {a.tools.map((t) => (
                <span key={t} className="label-mono inline-flex items-center gap-1 border px-1.5 py-0.5 text-muted-foreground">
                  <WrenchIcon className="size-3" /> {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Framework export */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="label-mono text-muted-foreground">Compile to</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {AGENT_FRAMEWORKS.map((f) => (
                <Button
                  key={f}
                  size="xs"
                  variant={framework === f ? "default" : "outline"}
                  onClick={() => chooseFramework(f)}
                  disabled={busy}
                >
                  {FRAMEWORK_LABELS[f]}
                </Button>
              ))}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(code.code);
              toast.success(`Copied ${code.filename}`);
            }}
          >
            <CopyIcon /> Copy code
          </Button>
        </div>
        <div className="border">
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <span className="font-mono text-xs">{code.filename}</span>
            <span className="label-mono text-muted-foreground">{code.language} · pushed with your app</span>
          </div>
          <pre className={cn("overflow-auto p-3 font-mono text-xs leading-5", pro ? "max-h-[32rem]" : "max-h-64")}>
            {code.code}
          </pre>
        </div>
      </div>
    </div>
  );
}
