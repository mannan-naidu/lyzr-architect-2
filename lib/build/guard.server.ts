import "server-only";

import { z } from "zod";

import { llmEnv } from "@/lib/env.server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type User = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function jsonError(status: number, error: string, code: string) {
  return Response.json({ error, code }, { status });
}

const PROJECT_COLUMNS =
  "id, name, description, framework, memory_enabled, plan, plan_status, agent_spec, seo_enabled, cms_enabled, deploy_slug, github_repo";

export type GuardedProject = {
  user: User;
  supabase: Supabase;
  project: {
    id: string;
    name: string;
    description: string | null;
    framework: string;
    memory_enabled: boolean;
    plan: unknown;
    plan_status: string;
    agent_spec: unknown;
    seo_enabled: boolean;
    cms_enabled: boolean;
    deploy_slug: string | null;
    github_repo: string | null;
  };
};

/**
 * Auth + ownership check shared by every project route. RLS is the real boundary: the select
 * returns nothing unless the signed-in user owns the project.
 */
export async function requireProject(projectId: string): Promise<GuardedProject | Response> {
  if (!z.uuid().safeParse(projectId).success) return jsonError(404, "Project not found.", "not_found");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in first.", "unauthorized");
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select(PROJECT_COLUMNS).eq("id", projectId).maybeSingle();
  if (!project) return jsonError(404, "Project not found.", "not_found");
  return { user, supabase, project };
}

/** Per-user rolling 24h token cap (lower for demo guests). Returns an error response or null. */
export async function checkTokenCap({ user, supabase }: Pick<GuardedProject, "user" | "supabase">) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase.from("messages").select("tokens_in, tokens_out").gte("created_at", since);
  const used = (data ?? []).reduce((sum, r) => sum + (r.tokens_in ?? 0) + (r.tokens_out ?? 0), 0);
  const { DAILY_TOKEN_CAP, DEMO_TOKEN_CAP } = llmEnv();
  const cap = user.isAnonymous ? DEMO_TOKEN_CAP : DAILY_TOKEN_CAP;
  if (used < cap) return null;
  const hint = user.isAnonymous ? " Sign in for a higher limit." : " Try again tomorrow.";
  return jsonError(429, `Daily limit reached (${cap.toLocaleString()} tokens).${hint}`, "token_cap");
}
