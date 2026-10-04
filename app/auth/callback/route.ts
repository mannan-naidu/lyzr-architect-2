import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth";
import { encryptToken } from "@/lib/github/crypto.server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback: Supabase redirects here with `?code=` after GitHub sign-in. We exchange it for a
 * session cookie, then send the user on. The `profiles` row is created by the
 * `on_auth_user_created` DB trigger, so there is nothing to insert here.
 *
 * After a GitHub sign-in, `session.provider_token` (the GitHub token, `repo` scope) is only
 * available right here: Supabase never stores or refreshes it. We encrypt it (AES-256-GCM) into
 * `github_connections` so Ship → GitHub can create repos and push for this user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const token = data.session?.provider_token;
      if (token) {
        await saveGitHubToken(supabase, token).catch((err: unknown) =>
          console.error("[github] couldn't store token:", err instanceof Error ? err.message : err),
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}

async function saveGitHubToken(supabase: Awaited<ReturnType<typeof createClient>>, token: string) {
  const res = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
  });
  // A Google sign-in also yields a provider token; GitHub rejects it, and we skip it.
  if (!res.ok) return;
  const login = ((await res.json()) as { login?: string }).login ?? null;
  const { error } = await supabase.from("github_connections").upsert({
    login,
    token_ciphertext: encryptToken(token),
    scopes: res.headers.get("x-oauth-scopes"),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
