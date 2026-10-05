import { getMemoryStatus } from "@/lib/memory/provider.server";
import { availableProviders } from "@/lib/ai/registry.server";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Deployment health for the owner: which LLM providers have keys and whether memory started.
 * Signed-in users only; reports booleans and scrubbed errors, never secrets.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  return Response.json({
    providers: availableProviders(),
    memory: await getMemoryStatus(),
    githubTokenKey: Boolean(process.env.GITHUB_TOKEN_KEY),
  });
}
