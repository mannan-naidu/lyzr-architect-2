"use client";

import { BrainIcon, FileTextIcon, PlusIcon, SearchIcon, type LucideIcon } from "lucide-react";
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

/** The three switches, as compact rows: short label + one line of help. */
const OPTIONS: { name: string; icon: LucideIcon; label: string; help: string; defaultChecked?: boolean }[] = [
  {
    name: "memory_enabled",
    icon: BrainIcon,
    label: "Memory",
    help: "Agents remember their users via Lyzr Cognis; you can view and delete it.",
    defaultChecked: true,
  },
  {
    name: "seo_enabled",
    icon: SearchIcon,
    label: "SEO + GEO (public website)",
    help: "Builds static-first HTML and ships meta tags, JSON-LD, sitemap and llms.txt.",
  },
  {
    name: "cms_enabled",
    icon: FileTextIcon,
    label: "Content mode",
    help: "Edit pages, posts and FAQs without code, or import them from WordPress.",
  },
];

export function NewProjectDialog({
  initialPrompt,
  initialName,
  initialSeo = false,
  initialCms = false,
  defaultOpen = false,
}: {
  initialPrompt?: string;
  initialName?: string;
  initialSeo?: boolean;
  initialCms?: boolean;
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
      {/* Capped to the viewport: the body scrolls, the header and buttons stay visible. */}
      <DialogContent className="flex max-h-[min(90dvh,760px)] flex-col gap-0 p-0 sm:max-w-lg">
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Name it, pick a framework, and decide if it should remember and be found.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              required
              maxLength={100}
              defaultValue={initialName}
              placeholder="Yoga studio site"
              autoFocus
            />
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
              placeholder="A site for my yoga studio with schedules, pricing, FAQs and an assistant for class questions."
              className="max-h-40"
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

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Options</legend>
            <div className="divide-y rounded-lg border">
              {OPTIONS.map(({ name, icon: Icon, label, help, defaultChecked }) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-start gap-3 p-3 transition-colors has-checked:bg-primary/5 hover:bg-accent/40"
                >
                  <input
                    type="checkbox"
                    name={name}
                    defaultChecked={
                      name === "seo_enabled" ? initialSeo : name === "cms_enabled" ? initialCms : defaultChecked
                    }
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span className="min-w-0 space-y-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Icon className="size-3.5" /> {label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{help}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">You can change these later in Plan and Ship.</p>
          </fieldset>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          </div>

          <DialogFooter className="m-0 border-t p-4">
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
