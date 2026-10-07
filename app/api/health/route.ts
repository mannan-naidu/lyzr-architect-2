import { availableProviders } from "@/lib/ai/registry.server";
import { getMemoryStatus } from "@/lib/memory/provider.server";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Deployment health: which LLM providers have keys and whether the memory service answers.
 * Signed-in users only; never returns secrets.
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
    memorySelftest:
      process.env.MEMORY_SERVICE_URL && process.env.MEMORY_SERVICE_TOKEN
        ? await (await import("@/lib/memory/cognis.server")).selftestCognis(
            process.env.MEMORY_SERVICE_URL,
            process.env.MEMORY_SERVICE_TOKEN,
          )
        : null,
    githubTokenKey: Boolean(process.env.GITHUB_TOKEN_KEY),
  });
}
