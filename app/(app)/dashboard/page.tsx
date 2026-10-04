import { BrainIcon, FolderIcon } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_LABELS } from "@/lib/types/database";

import { NewProjectDialog } from "./new-project-dialog";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const params = await searchParams;
  const prompt = typeof params.prompt === "string" ? params.prompt.slice(0, 2000) : undefined;
  const openNew = Boolean(prompt) || params.new === "1";

  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, description, framework, mode, memory_enabled, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto border-x">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b p-6">
        <div className="space-y-2">
          <span className="label-mono text-primary">Workspace</span>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Agents and apps you&apos;re building.</p>
        </div>
        {/* Arriving from the landing prompt box opens the dialog pre-filled. */}
        <NewProjectDialog key={openNew ? "open" : "closed"} initialPrompt={prompt} defaultOpen={openNew} />
      </div>

      {error ? (
        <p role="alert" className="p-6 text-sm text-destructive">
          Couldn&apos;t load projects: {error.message}
        </p>
      ) : !projects?.length ? (
        <div className="flex flex-col items-center gap-3 p-16 text-center">
          <FolderIcon className="size-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first agent. Architect will remember your choices for the next one.
          </p>
          <NewProjectDialog />
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <li key={project.id} className="border-b sm:border-r">
              <Link
                href={`/p/${project.id}`}
                className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-card focus-visible:outline-2"
              >
                <div className="flex items-center justify-between">
                  <span className="label-mono text-primary">{FRAMEWORK_LABELS[project.framework]}</span>
                  <span className="label-mono text-muted-foreground/60">{String(i + 1).padStart(3, "0")}</span>
                </div>
                <h2 className="truncate text-lg font-semibold group-hover:text-primary">{project.name}</h2>
                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {project.description ?? "No description"}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-2">
                  {project.memory_enabled ? (
                    <span className="label-mono inline-flex items-center gap-1 text-muted-foreground">
                      <BrainIcon className="size-3" /> Memory on
                    </span>
                  ) : null}
                  <span className="label-mono ml-auto text-muted-foreground">
                    {dateFormat.format(new Date(project.updated_at))}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
