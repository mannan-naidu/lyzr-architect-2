"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { frameworkSchema, planSchema } from "@/lib/build/schemas";
import { createClient } from "@/lib/supabase/server";

const setModeSchema = z.object({
  projectId: z.uuid(),
  mode: z.enum(["simple", "pro"]),
});

/** Persist the Simple ↔ Pro switch on the project. RLS ensures only the owner can update it. */
export async function setProjectMode(input: z.input<typeof setModeSchema>) {
  const { projectId, mode } = setModeSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ mode }).eq("id", projectId);
  if (error) return { error: error.message };
  revalidatePath(`/p/${projectId}`);
  return { ok: true as const };
}

/**
 * Approve the plan: lock it, turn its agents into the project's agent spec, and record its
 * decisions in the decision log (which is injected into every later turn).
 */
export async function approvePlan(input: { projectId: string }) {
  const { projectId } = z.object({ projectId: z.uuid() }).parse(input);
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("plan").eq("id", projectId).maybeSingle();
  const plan = planSchema.safeParse(project?.plan);
  if (!plan.success) return { error: "There is no plan to approve yet." };

  const { error } = await supabase
    .from("projects")
    .update({ plan_status: "approved", agent_spec: plan.data.agents })
    .eq("id", projectId);
  if (error) return { error: error.message };

  await supabase.from("decisions").delete().eq("project_id", projectId).eq("source", "plan");
  if (plan.data.decisions.length) {
    await supabase
      .from("decisions")
      .insert(plan.data.decisions.map((text) => ({ project_id: projectId, text: text.slice(0, 500), source: "plan" as const })));
  }
  revalidatePath(`/p/${projectId}`);
  return { ok: true as const };
}

/** Add a decision by hand, or remove one (Memory tab → Decision log). */
export async function addDecision(input: { projectId: string; text: string }) {
  const { projectId, text } = z
    .object({ projectId: z.uuid(), text: z.string().trim().min(1).max(500) })
    .parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("decisions").insert({ project_id: projectId, text, source: "user" });
  if (error) return { error: error.message };
  revalidatePath(`/p/${projectId}`);
  return { ok: true as const };
}

export async function deleteDecision(input: { projectId: string; decisionId: string }) {
  const { projectId, decisionId } = z.object({ projectId: z.uuid(), decisionId: z.uuid() }).parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("decisions").delete().eq("id", decisionId).eq("project_id", projectId);
  if (error) return { error: error.message };
  revalidatePath(`/p/${projectId}`);
  return { ok: true as const };
}

/** Project-level toggles: builder memory for this project, SEO/GEO, CMS. */
export async function setProjectFlags(input: {
  projectId: string;
  memory_enabled?: boolean;
  seo_enabled?: boolean;
  cms_enabled?: boolean;
}) {
  const { projectId, ...flags } = z
    .object({
      projectId: z.uuid(),
      memory_enabled: z.boolean().optional(),
      seo_enabled: z.boolean().optional(),
      cms_enabled: z.boolean().optional(),
    })
    .parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(flags).eq("id", projectId);
  if (error) return { error: error.message };
  revalidatePath(`/p/${projectId}`);
  return { ok: true as const };
}

/** Pro mode "edit by hand": save a file the user changed; the agent builds on it next turn. */
export async function saveFileByHand(input: { projectId: string; path: string; content: string }) {
  const { projectId, path, content } = z
    .object({
      projectId: z.uuid(),
      path: z.string().regex(/^\/[\w./-]+$/).max(512),
      content: z.string().max(200_000),
    })
    .parse(input);
  if (path === "/agents.ts") return { error: "/agents.ts is provided by Architect and can't be edited." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("project_files")
    .select("content")
    .eq("project_id", projectId)
    .eq("path", path)
    .maybeSingle();
  const { error } = await supabase.from("project_files").upsert(
    { project_id: projectId, path, content, previous_content: existing?.content ?? null, updated_by: "user" },
    { onConflict: "project_id,path" },
  );
  if (error) return { error: error.message };
  return { ok: true as const };
}

/** Agent memory toggle (Agents tab): whether an agent remembers its end users across sessions. */
export async function setAgentMemory(input: { projectId: string; agentName: string; memory: boolean }) {
  const { projectId, agentName, memory } = z
    .object({ projectId: z.uuid(), agentName: z.string().min(1).max(200), memory: z.boolean() })
    .parse(input);
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("plan").eq("id", projectId).maybeSingle();
  const plan = planSchema.safeParse(project?.plan);
  if (!plan.success) return { error: "There is no plan yet." };
  const agents = plan.data.agents.map((a) => (a.name === agentName ? { ...a, memory } : a));
  const { error } = await supabase
    .from("projects")
    .update({ plan: { ...plan.data, agents }, agent_spec: agents })
    .eq("id", projectId);
  if (error) return { error: error.message };
  return { ok: true as const, plan: { ...plan.data, agents } };
}

/** Change the framework the agents compile to (Agents tab). */
export async function setFramework(input: { projectId: string; framework: string }) {
  const { projectId, framework } = z.object({ projectId: z.uuid(), framework: frameworkSchema }).parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ framework }).eq("id", projectId);
  if (error) return { error: error.message };
  revalidatePath(`/p/${projectId}`);
  return { ok: true as const };
}
