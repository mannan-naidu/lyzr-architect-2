import { z } from "zod";

/**
 * Environment validation.
 *
 * - `publicEnv` is safe to import anywhere (client or server). Next.js inlines NEXT_PUBLIC_*
 *   values at build time only when referenced literally, so each one is spelled out below.
 * - `serverEnv()` lives in `lib/env.server.ts` (guarded by `server-only`) so secrets can never
 *   be bundled into client code.
 *
 * Both are validated lazily (on first use) so `next build` doesn't fail for routes that never
 * touch a given variable, and both throw a readable error naming every missing/invalid var.
 */

const nonEmpty = z.string().trim().min(1, "is required");

export const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("must be a URL, e.g. https://abc.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty,
});

export type PublicEnv = z.infer<typeof publicSchema>;

export function formatEnvError(scope: string, error: z.ZodError): Error {
  const lines = error.issues.map((issue) => {
    const key = issue.path.join(".") || "(env)";
    return `  • ${key}: ${issue.message}`;
  });
  return new Error(
    `Invalid ${scope} environment variables:\n${lines.join("\n")}\n` +
      `See .env.example for what each variable is and where to find it.`,
  );
}

let cachedPublic: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  if (cachedPublic) return cachedPublic;
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) throw formatEnvError("public", parsed.error);
  cachedPublic = parsed.data;
  return cachedPublic;
}
