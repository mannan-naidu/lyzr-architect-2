import { notFound } from "next/navigation";
import { z } from "zod";

import { availableProviders } from "@/lib/ai/registry.server";
import { planSchema } from "@/lib/build/schemas";
import type { ArchitectUIMessage } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/server";

import { Workspace } from "./workspace";
import type { WorkspaceData } from "./workspace-context";

export default async function ProjectPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, description, framework, mode, memory_enabled, seo_enabled, cms_enabled, github_repo, deploy_slug, plan, plan_status",
    )
    .eq("id", id)
    .maybeSingle();

  // RLS returns nothing for other users' projects, so "not yours" and "doesn't exist" look the same.
  if (!project) notFound();

  const [messages, files, decisions, events, fixes, ledger] = await Promise.all([
    supabase
      .from("messages")
      .select("id, role, content")
      .eq("project_id", id)
      .eq("kind", "chat")
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("project_files")
      .select("path, content, previous_content, updated_at")
      .eq("project_id", id)
      .order("path"),
    supabase.from("decisions").select("*").eq("project_id", id).order("created_at"),
    supabase.from("run_events").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(300),
    supabase.from("fix_attempts").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(100),
    supabase
      .from("messages")
      .select("id, kind, model, tokens_in, tokens_out, billed_to, created_at")
      .eq("project_id", id)
      .not("tokens_in", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // Stored as plain text; the per-turn memory/usage parts are live-only for now.
  const initialMessages: ArchitectUIMessage[] = (messages.data ?? []).map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    parts: [{ type: "text", text: m.content }],
  }));

  const plan = planSchema.safeParse(project.plan);
  const data: WorkspaceData = {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      framework: project.framework,
      mode: project.mode,
      memory_enabled: project.memory_enabled,
      seo_enabled: project.seo_enabled,
      cms_enabled: project.cms_enabled,
      github_repo: project.github_repo,
      deploy_slug: project.deploy_slug,
    },
    plan: plan.success ? plan.data : null,
    planStatus: plan.success ? project.plan_status : "none",
    files: files.data ?? [],
    decisions: decisions.data ?? [],
    events: events.data ?? [],
    fixes: fixes.data ?? [],
    ledger: ledger.data ?? [],
  };

  return <Workspace data={data} initialMessages={initialMessages} availableProviders={availableProviders()} />;
}
