"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { AGENT_FRAMEWORKS } from "@/lib/types/database";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Keep it under 100 characters"),
  description: z.string().trim().max(2000).optional().transform((v) => v || null),
  framework: z.enum(AGENT_FRAMEWORKS),
  memory_enabled: z.boolean(),
  seo_enabled: z.boolean(),
});

export type CreateProjectState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function createProject(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    framework: formData.get("framework"),
    memory_enabled: formData.get("memory_enabled") === "on",
    seo_enabled: formData.get("seo_enabled") === "on",
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create the project." };

  revalidatePath("/dashboard");
  redirect(`/p/${data.id}`);
}
