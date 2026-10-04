import { notFound } from "next/navigation";
import { z } from "zod";

import { availableProviders } from "@/lib/ai/registry.server";
import type { ArchitectUIMessage } from "@/lib/chat/types";
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

  const { data: rows } = await supabase
    .from("messages")
    .select("id, role, content")
    .eq("project_id", id)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(200);

  // Stored as plain text; the per-turn memory/usage parts are live-only for now.
  const initialMessages: ArchitectUIMessage[] = (rows ?? []).map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    parts: [{ type: "text", text: m.content }],
  }));

  return (
    <Workspace
      project={project}
      initialMessages={initialMessages}
      availableProviders={availableProviders()}
    />
  );
}
