import { BrainIcon, FolderIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Agents and apps you&apos;re building.</p>
        </div>
        {/* Arriving from the landing prompt box opens the dialog pre-filled. */}
        <NewProjectDialog key={openNew ? "open" : "closed"} initialPrompt={prompt} defaultOpen={openNew} />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t load projects: {error.message}
        </p>
      ) : !projects?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <FolderIcon className="size-8 text-muted-foreground" />
          <h2 className="font-medium">No projects yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first agent. Architect will remember your choices for the next one.
          </p>
          <NewProjectDialog />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/p/${project.id}`} className="block h-full rounded-xl focus-visible:outline-2">
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="truncate">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-10">
                      {project.description ?? "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{FRAMEWORK_LABELS[project.framework]}</Badge>
                    {project.memory_enabled ? (
                      <Badge variant="outline" className="gap-1">
                        <BrainIcon className="size-3" /> Memory
                      </Badge>
                    ) : null}
                    <span className="ml-auto">{dateFormat.format(new Date(project.updated_at))}</span>
                  </CardFooter>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
