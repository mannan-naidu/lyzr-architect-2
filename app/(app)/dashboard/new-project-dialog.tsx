"use client";

import { BrainIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_FRAMEWORKS, FRAMEWORK_LABELS } from "@/lib/types/database";

import { createProject, type CreateProjectState } from "./actions";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export function NewProjectDialog({
  initialPrompt,
  defaultOpen = false,
}: {
  initialPrompt?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(
    createProject,
    {},
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={formAction} className="space-y-5">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Name it, pick a framework, and decide if it should remember and be found.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input id="name" name="name" required maxLength={100} placeholder="Support triage agent" autoFocus />
            {state.fieldErrors?.name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              What should it do? <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={initialPrompt}
              placeholder="Answers customer questions from our docs and escalates to Slack."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="framework" className="text-sm font-medium">
              Framework
            </label>
            <select id="framework" name="framework" defaultValue="lyzr" className={SELECT_CLASS}>
              {AGENT_FRAMEWORKS.map((fw) => (
                <option key={fw} value={fw}>
                  {FRAMEWORK_LABELS[fw]}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-primary/5">
            <input type="checkbox" name="memory_enabled" defaultChecked className="mt-1 size-4 accent-primary" />
            <span className="space-y-1">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <BrainIcon className="size-4" /> Give this agent memory
              </span>
              <span className="block text-sm text-muted-foreground">
                The agent remembers users&apos; preferences and past conversations via Lyzr Cognis. You can view
                and delete memories anytime.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-primary/5">
            <input type="checkbox" name="seo_enabled" className="mt-1 size-4 accent-primary" />
            <span className="space-y-1">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <SearchIcon className="size-4" /> Public website: optimise for search and AI answers
              </span>
              <span className="block text-sm text-muted-foreground">
                SEO + GEO. Builds static-first so every word is real HTML, then deploys a pre-rendered page with meta tags,
                sitemap, JSON-LD and llms.txt. Best switched on now; you can change it in the Plan step.
              </span>
            </span>
          </label>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
