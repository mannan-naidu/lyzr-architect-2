import { createHash } from "node:crypto";

import { availableProviders } from "@/lib/ai/registry.server";
import { getMemoryStatus } from "@/lib/memory/provider.server";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Shape of DATABASE_URL for troubleshooting: flags only, never the password itself. */
function databaseUrlShape() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { set: false };
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { set: true, parses: false };
  }
  const password = decodeURIComponent(url.password);
  return {
    set: true,
    parses: true,
    surroundingWhitespaceOrQuotes: raw !== trimmed || /^["']|["']$/.test(trimmed),
    host: url.hostname.endsWith(".pooler.supabase.com")
      ? "supabase pooler"
      : url.hostname.startsWith("db.")
        ? "supabase direct (IPv6-only, won't work on Vercel)"
        : "other",
    port: url.port,
    userLooksLikePooler: /^postgres\.[a-z0-9]{20}$/.test(decodeURIComponent(url.username)),
    passwordLength: password.length,
    passwordStillHasPlaceholder: /YOUR-PASSWORD|\[|\]/i.test(password),
    passwordHasSpecialChars: /[^A-Za-z0-9]/.test(password),
    // First 8 hex chars of sha256(password): compare with your own value to confirm which password is deployed.
    passwordFingerprint: createHash("sha256").update(password).digest("hex").slice(0, 8),
    hasQueryParams: url.search.length > 0,
  };
}

/**
 * Deployment health: which LLM providers have keys, whether memory started, and the shape of
 * the database URL. Signed-in users only; never returns secrets.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  return Response.json({
    deployment: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      id: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      instanceStarted: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    },
    providers: availableProviders(),
    memory: await getMemoryStatus(),
    databaseUrl: databaseUrlShape(),
    githubTokenKey: Boolean(process.env.GITHUB_TOKEN_KEY),
  });
}
