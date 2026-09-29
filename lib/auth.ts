import { z } from "zod";

/** Only allow same-origin relative paths as post-login redirects (prevents open redirects). */
const nextPath = z
  .string()
  .regex(/^\/(?!\/)[^\\]*$/, "must be a relative path")
  .max(512);

export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  const parsed = nextPath.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
