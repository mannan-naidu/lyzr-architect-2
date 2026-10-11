"use client";

import { BotIcon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { SwitchToggle } from "@/components/switch-toggle";

import { setProjectFlags } from "../actions";
import { useWorkspace } from "../workspace-context";

/**
 * "Does this app need AI agents?" Off means a regular app: the planner returns no agents. On means
 * Architect adds agents only where the app needs AI. Changing it applies the next time you plan.
 */
export function AgentsSwitch() {
  const { project, plan } = useWorkspace();
  const [on, setOn] = useOptimistic(project.agents_enabled);
  const [, start] = useTransition();

  const toggle = (next: boolean) =>
    start(async () => {
      setOn(next);
      const result = await setProjectFlags({ projectId: project.id, agents_enabled: next });
      if ("error" in result) {
        const message = result.error ?? "Couldn't save.";
        toast.error(/agents_enabled/.test(message) ? "Run the latest database migration to change this." : message);
      } else if (plan) {
        toast.info(next ? "AI agents allowed" : "No AI agents", { description: "Revise the plan below to apply it." });
      }
    });

  return (
    <div className="flex items-start gap-3 border bg-card p-3">
      <BotIcon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">AI agents, if the app needs them</p>
        <p className="text-xs text-muted-foreground">
          On: Architect adds agents only where the app needs AI (answering, summarising, deciding). Off: a regular app
          or website with no agents and no framework to pick.
        </p>
      </div>
      <SwitchToggle checked={on} onCheckedChange={toggle} label="AI agents" />
    </div>
  );
}
