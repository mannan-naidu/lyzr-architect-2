"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PROVIDER_SCOPES = {
  // `repo` lets us push generated projects later (see ADR-002 for the trade-off).
  github: "read:user user:email repo",
  google: "openid email profile",
} as const;

const providerSchema = z.enum(["github", "google"]);

/** Starts OAuth via Supabase (GitHub or Google) and redirects the browser to the provider. */
export async function signInWithProvider(formData: FormData) {
  const parsed = providerSchema.safeParse(formData.get("provider"));
  if (!parsed.success) redirect("/login?error=unknown_provider");
  const provider = parsed.data;

  const next = safeNextPath(formData.get("next")?.toString());
  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    `${headerList.get("x-forwarded-proto") ?? "http"}://${headerList.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: PROVIDER_SCOPES[provider],
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }
  redirect(data.url);
}

/**
 * Demo mode: a real (anonymous) Supabase user, so RLS, chat and memory all work without an
 * account. Seeds one sample project so a reviewer lands on something to explore.
 * Requires "Allow anonymous sign-ins" in Supabase → Authentication → Sign In / Providers.
 */
export async function signInAsGuest() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "demo_unavailable")}`);
  }

  const { data: project } = await supabase
    .from("projects")
    .insert({
      owner_id: data.user.id,
      name: "Support triage agent (demo)",
      description:
        "An agent that answers customer questions from our FAQ PDF and escalates unresolved ones to the team by email, with a small dashboard of escalations.",
      framework: "lyzr",
      memory_enabled: true,
    })
    .select("id")
    .single();

  redirect(project ? `/p/${project.id}` : "/dashboard");
}
