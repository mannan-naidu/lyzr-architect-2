import { z } from "zod";

import { jsonError, requireProject } from "@/lib/build/guard.server";

const bodySchema = z.object({
  signature: z.string().regex(/^[0-9a-f]{16}$/),
  outcome: z.enum(["succeeded", "failed"]),
});

/**
 * The preview reports back after a fix: if it rendered cleanly the pending attempt is marked
 * succeeded, which is what makes it a "known fix" for the same error in future projects.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/fix/outcome">) {
  const { id } = await ctx.params;
  const guard = await requireProject(id);
  if (guard instanceof Response) return guard;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid request body.", "bad_request");

  const { error } = await guard.supabase
    .from("fix_attempts")
    .update({ outcome: parsed.data.outcome })
    .eq("project_id", id)
    .eq("error_signature", parsed.data.signature)
    .eq("outcome", "pending");
  if (error) return jsonError(500, error.message, "update_failed");
  return Response.json({ ok: true });
}
