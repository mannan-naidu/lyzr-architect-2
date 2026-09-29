import { notFound } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { Workspace } from "./workspace";

export default async function ProjectPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, framework, mode, memory_enabled, github_repo")
    .eq("id", id)
    .maybeSingle();

  // RLS returns nothing for other users' projects, so "not yours" and "doesn't exist" look the same.
  if (!project) notFound();

  return <Workspace project={project} />;
}
