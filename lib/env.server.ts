import "server-only";

import { z } from "zod";

import { formatEnvError, publicSchema } from "@/lib/env";

const nonEmpty = z.string().trim().min(1, "is required");
const optionalKey = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const LLM_KEYS = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
] as const;

const serverSchema = publicSchema
  .extend({
    SUPABASE_SERVICE_ROLE_KEY: nonEmpty,
    DATABASE_URL: z
      .string()
      .trim()
      .regex(/^postgres(ql)?:\/\//, "must be a postgres:// connection string"),
    ANTHROPIC_API_KEY: optionalKey,
    OPENAI_API_KEY: optionalKey,
    GOOGLE_GENERATIVE_AI_API_KEY: optionalKey,
    GROQ_API_KEY: optionalKey,
    OPENROUTER_API_KEY: optionalKey,
    MEMORI_API_KEY: optionalKey,
  })
  .superRefine((env, ctx) => {
    if (!LLM_KEYS.some((key) => env[key])) {
      ctx.addIssue({
        code: "custom",
        path: ["LLM"],
        message: `set at least one of ${LLM_KEYS.join(", ")}`,
      });
    }
  });

export type ServerEnv = z.infer<typeof serverSchema>;

const llmSchema = z.object({
  ANTHROPIC_API_KEY: optionalKey,
  OPENAI_API_KEY: optionalKey,
  GOOGLE_GENERATIVE_AI_API_KEY: optionalKey,
  GROQ_API_KEY: optionalKey,
  OPENROUTER_API_KEY: optionalKey,
  /** Per-user daily token cap across all projects (protects the shared demo keys). */
  DAILY_TOKEN_CAP: z.coerce.number().int().positive().default(200_000),
  /** Lower cap for demo-mode (anonymous) guests. */
  DEMO_TOKEN_CAP: z.coerce.number().int().positive().default(30_000),
});

export type LlmEnv = z.infer<typeof llmSchema>;

/**
 * Just the LLM keys and limits. Unlike serverEnv() this doesn't require the Supabase/DB secrets,
 * so the chat route can report "no key for this provider" precisely.
 */
export function llmEnv(): LlmEnv {
  const parsed = llmSchema.safeParse(process.env);
  if (!parsed.success) throw formatEnvError("LLM", parsed.error);
  return parsed.data;
}

let cached: ServerEnv | undefined;

/** Validated server-side env (secrets included). Throws a readable error on first bad access. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) throw formatEnvError("server", parsed.error);
  cached = parsed.data;
  return cached;
}
