"use client";

import { BrainIcon, ChevronDownIcon, LoaderIcon } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { MemoryPartData } from "@/lib/memory/types";
import { cn } from "@/lib/utils";

const SCOPE_LABEL = { user: "You", project: "This project", agent: "Agent" } as const;

/**
 * The per-reply memory dropdown: collapsed by default ("🧠 Recalled 3 ▾"), expanding to show
 * exactly which memories shaped this answer and whether this turn was saved to memory.
 */
export function MemoryRecall({ data }: { data: MemoryPartData }) {
  if (data.status === "off") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BrainIcon className="size-3.5" />
        {data.reason === "disabled" ? "Memory is off for this project" : "Memory unavailable"}
      </p>
    );
  }

  if (data.status === "recalling") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LoaderIcon className="size-3.5 animate-spin" /> Checking memory…
      </p>
    );
  }

  const count = data.recalled.length;
  const savedLabel =
    data.captured === "pending" ? "saving…" : data.captured === "saved" ? "turn saved" : "save failed";

  return (
    <Collapsible className="group/memory text-xs">
      <CollapsibleTrigger className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
        <BrainIcon className="size-3.5" />
        <span>{count ? `Recalled ${count}` : "Nothing recalled"}</span>
        <span aria-hidden>·</span>
        <span className={cn(data.captured === "failed" && "text-destructive")}>{savedLabel}</span>
        <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=open]/memory:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-1.5 rounded-md border bg-muted/40 p-2">
        {count ? (
          <ul className="space-y-1.5">
            {data.recalled.map((m, i) => (
              <li key={i} className="flex items-start justify-between gap-3">
                <span className="text-foreground">{m.content}</span>
                <span className="shrink-0 text-muted-foreground">
                  {SCOPE_LABEL[m.scope]} · {Math.round(m.score * 100)}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No earlier memories matched this message.</p>
        )}
        <p className="border-t pt-1.5 text-muted-foreground">
          New facts from this turn are extracted in the background and appear in the Memory tab,
          where you can edit or delete them.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
