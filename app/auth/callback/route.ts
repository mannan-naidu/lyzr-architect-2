import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback: Supabase redirects here with `?code=` after GitHub sign-in. We exchange it for a
 * session cookie, then send the user on. The `profiles` row is created by the
 * `on_auth_user_created` DB trigger, so there is nothing to insert here.
 *
 * TODO(Session 5, GitHub push): `data.session.provider_token` (the GitHub token) is only available
 * right here — Supabase never refreshes it. Capture and store it encrypted server-side then.
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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
