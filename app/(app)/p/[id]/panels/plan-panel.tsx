"use client";

import { BrainIcon, CheckIcon, HammerIcon, LoaderIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Plan } from "@/lib/build/schemas";

import { approvePlan } from "../actions";
import { readApiError, useWorkspace } from "../workspace-context";
import { SeoSwitch } from "./seo-switch";
import { useBuild } from "./use-build";

/** Plan before build: generate → review → revise → approve & build. */
export function PlanPanel() {
  const { project, plan, planStatus, setPlan, modelId, files } = useWorkspace();
  const [pending, setPending] = useState(false);
  const [recalled, setRecalled] = useState<string[]>([]);
  const [revision, setRevision] = useState("");
  const [approving, startApprove] = useTransition();
  const startBuild = useBuild();

  const generate = async (prompt?: string) => {
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/plan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ modelId, prompt }),
      });
      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }
      const body = (await res.json()) as { plan: Plan; recalled: { content: string }[] };
      setPlan(body.plan, "draft");
      setRecalled(body.recalled.map((m) => m.content));
      setRevision("");
    } finally {
      setPending(false);
    }
  };

  const approveAndBuild = () =>
    startApprove(async () => {
      const result = await approvePlan({ projectId: project.id });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPlan(plan, "approved");
      await startBuild();
    });

  if (!plan) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4 p-8">
        <span className="label-mono text-primary">Step 1 · Plan</span>
        <h2 className="text-2xl font-semibold">Plan before building</h2>
        <p className="text-sm text-muted-foreground">
          Architect drafts the screens, the agents and the key decisions first, using what it remembers
          about how you build. You approve, then it builds.
        </p>
        <div className="w-full border bg-card p-3 text-sm">
          <span className="label-mono block text-muted-foreground">Your idea</span>
          {project.description ?? "Describe your app in the chat, or add a description to the project."}
        </div>
        <div className="w-full">
          <SeoSwitch />
        </div>
        <Button onClick={() => void generate()} disabled={pending || !project.description}>
          {pending ? <LoaderIcon className="animate-spin" /> : <SparklesIcon />}
          {pending ? "Planning… checking your memory" : "Generate the plan"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="label-mono text-primary">
            Plan · {planStatus === "approved" ? "approved" : "draft"}
          </span>
          <h2 className="text-2xl font-semibold">{plan.title}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{plan.summary}</p>
        </div>
        {planStatus === "approved" ? (
          <Button onClick={() => void startBuild()} disabled={approving}>
            <HammerIcon /> {files.length ? "Rebuild" : "Build it"}
          </Button>
        ) : (
          <Button onClick={approveAndBuild} disabled={approving || pending}>
            {approving ? <LoaderIcon className="animate-spin" /> : <CheckIcon />} Approve & build
          </Button>
        )}
      </div>

      <SeoSwitch />

      {recalled.length ? (
        <div className="flex items-start gap-2 border border-primary/30 bg-primary/5 p-3 text-sm">
          <BrainIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium">Pre-filled from memory:</span> {recalled.slice(0, 3).join(" · ")}
          </span>
        </div>
      ) : null}

      <section className="grid gap-px border bg-border md:grid-cols-2">
        <div className="space-y-2 bg-background p-4">
          <span className="label-mono text-muted-foreground">Screens</span>
          <ul className="space-y-2 text-sm">
            {plan.screens.map((s) => (
              <li key={s.name}>
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground"> · {s.purpose}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 bg-background p-4">
          <span className="label-mono text-muted-foreground">Decisions</span>
          <ul className="flex flex-wrap gap-2">
            {plan.decisions.map((d) => (
              <li key={d} className="border bg-card px-2 py-1 text-xs">
                {d}
              </li>
            ))}
          </ul>
          {plan.dataSources.length ? (
            <p className="pt-2 text-xs text-muted-foreground">Data: {plan.dataSources.join(", ")}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-2">
        <span className="label-mono text-muted-foreground">Agents</span>
        {plan.agents.length === 0 ? (
          <p className="border border-dashed p-4 text-sm text-muted-foreground">
            No AI agents: this is a regular app. Ask for one under &ldquo;Change something&rdquo; if it needs AI.
          </p>
        ) : (
        <div className="grid gap-px border bg-border sm:grid-cols-2">
          {plan.agents.map((a, i) => (
            <article key={a.name} className="space-y-2 bg-background p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{a.name}</h3>
                <span className="label-mono text-muted-foreground">{String(i + 1).padStart(3, "0")}</span>
              </div>
              <p className="text-sm text-muted-foreground">{a.role}</p>
              <div className="flex flex-wrap gap-1.5">
                {a.tools.map((t) => (
                  <span key={t} className="label-mono border px-1.5 py-0.5 text-[10px]">
                    {t}
                  </span>
                ))}
                {a.memory ? (
                  <span className="label-mono inline-flex items-center gap-1 border border-primary/40 px-1.5 py-0.5 text-[10px] text-primary">
                    <BrainIcon className="size-3" /> memory
                  </span>
                ) : null}
              </div>
              {a.handsOffTo.length ? (
                <p className="text-xs text-muted-foreground">Hands off to → {a.handsOffTo.join(", ")}</p>
              ) : null}
            </article>
          ))}
        </div>
        )}
      </section>

      <details className="border p-4 text-sm">
        <summary className="label-mono cursor-pointer text-muted-foreground">User stories ({plan.userStories.length})</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {plan.userStories.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </details>

      {plan.openQuestion ? (
        <p className="border-l-2 border-[var(--yellow)] pl-3 text-sm">
          <span className="label-mono block text-[var(--yellow)]">Open question</span>
          {plan.openQuestion}
        </p>
      ) : null}

      <div className="space-y-2">
        <span className="label-mono text-muted-foreground">Change something</span>
        <Textarea
          value={revision}
          onChange={(e) => setRevision(e.target.value)}
          rows={2}
          placeholder="e.g. Add a Slack escalation option and make the dashboard denser"
        />
        <Button variant="outline" size="sm" disabled={pending || !revision.trim()} onClick={() => void generate(revision)}>
          {pending ? <LoaderIcon className="animate-spin" /> : <RefreshCwIcon />} Revise plan
        </Button>
      </div>
    </div>
  );
}
