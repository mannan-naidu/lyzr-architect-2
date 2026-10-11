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
  cms_enabled: z.boolean(),
  agents_enabled: z.boolean(),
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
    cms_enabled: formData.get("cms_enabled") === "on",
    agents_enabled: formData.get("agents") !== "none",
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const insert = (row: typeof parsed.data | Omit<typeof parsed.data, "agents_enabled">) =>
    supabase.from("projects").insert({ ...row, owner_id: user.id }).select("id").single();
  let { data, error } = await insert(parsed.data);
  // Database without the agents_enabled column yet (2026-10-11 migration): create without it.
  if (error && /agents_enabled/.test(error.message)) {
    const rest: Omit<typeof parsed.data, "agents_enabled"> = { ...parsed.data };
    delete (rest as Partial<typeof parsed.data>).agents_enabled;
    ({ data, error } = await insert(rest));
  }

  if (error || !data) return { error: error?.message ?? "Could not create the project." };

  revalidatePath("/dashboard");
  redirect(`/p/${data.id}`);
}
