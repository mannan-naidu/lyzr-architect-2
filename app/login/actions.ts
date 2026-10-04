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
