"use client";

import { CheckIcon, ChevronsUpDownIcon, LayoutGridIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useWorkspace } from "./workspace-context";

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function ago(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

/** The breadcrumb doubles as a project switcher, like Claude Code, Lovable and architect.new. */
export function ProjectSwitcher() {
  const { project, projects } = useWorkspace();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex min-w-0 items-center gap-1.5 rounded-sm px-1 py-0.5 font-mono text-xs transition-colors hover:bg-accent/60 focus-visible:outline-2"
        aria-label="Switch project"
        data-tour="project-switcher"
      >
        <span className="text-muted-foreground">workspace /</span>
        <h1 className="truncate font-mono text-xs font-normal tracking-normal">{project.name}</h1>
        <ChevronsUpDownIcon className="size-3 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch project</DropdownMenuLabel>
        <div className="max-h-72 overflow-y-auto">
          {projects.map((p) => (
            <DropdownMenuItem key={p.id} asChild>
              <Link href={`/p/${p.id}`} className="flex items-center gap-2">
                <CheckIcon className={p.id === project.id ? "size-3.5 text-primary" : "size-3.5 opacity-0"} />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{ago(p.updated_at)}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard?new=1">
            <PlusIcon /> New project
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutGridIcon /> All projects
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
