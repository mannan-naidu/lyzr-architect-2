"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const setModeSchema = z.object({
  projectId: z.uuid(),
  mode: z.enum(["simple", "pro"]),
});

/** Persist the Simple ↔ Pro switch on the project. RLS ensures only the owner can update it. */
export async function setProjectMode(input: z.input<typeof setModeSchema>) {
  const { projectId, mode } = setModeSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ mode }).eq("id", projectId);
  if (error) return { error: error.message };
  revalidatePath(`/p/${projectId}`);
  return { ok: true as const };
}
