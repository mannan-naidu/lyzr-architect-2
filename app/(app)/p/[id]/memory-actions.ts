"use server";

import { z } from "zod";

import type { StoredMemory } from "@/lib/memory/types";
import { getMemoryProvider, getMemoryStatus } from "@/lib/memory/provider.server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

// The Memory panel's controls. The memory service lives outside Supabase RLS, so every action
// first checks that the signed-in user owns the project, and every call is scoped to that user's id.

const projectIdSchema = z.uuid();
const memoryIdSchema = z.string().trim().min(1).max(64);

async function ownerOf(projectId: string): Promise<{ userId: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in again." };
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (!data) return { error: "Project not found." };
  return { userId: user.id };
}

export async function listMemories(input: {
  projectId: string;
}): Promise<{ memories: StoredMemory[]; backend: string } | { error: string }> {
  const projectId = projectIdSchema.parse(input.projectId);
  const owner = await ownerOf(projectId);
  if ("error" in owner) return owner;
  const provider = await getMemoryProvider();
  if (!provider) {
    const status = await getMemoryStatus();
    if (status.status === "error") return { error: `Memory couldn't start: ${status.error}` };
    return { memories: [], backend: "none" };
  }
  try {
    return { memories: await provider.list(owner.userId, projectId), backend: provider.name };
  } catch (err) {
    console.error("[memory] list failed:", err instanceof Error ? err.message : err);
    return { error: "Couldn't load memories right now." };
  }
}

export async function updateMemory(input: { projectId: string; memoryId: string; content: string }) {
  const { projectId, memoryId, content } = z
    .object({ projectId: projectIdSchema, memoryId: memoryIdSchema, content: z.string().trim().min(1).max(1000) })
    .parse(input);
  const owner = await ownerOf(projectId);
  if ("error" in owner) return owner;
  const provider = await getMemoryProvider();
  if (!provider || !(await provider.update(owner.userId, memoryId, content))) return { error: "Memory not found." };
  return { ok: true as const };
}

export async function deleteMemory(input: { projectId: string; memoryId: string }) {
  const { projectId, memoryId } = z.object({ projectId: projectIdSchema, memoryId: memoryIdSchema }).parse(input);
  const owner = await ownerOf(projectId);
  if ("error" in owner) return owner;
  const provider = await getMemoryProvider();
  if (!provider || !(await provider.remove(owner.userId, memoryId))) return { error: "Memory not found." };
  return { ok: true as const };
}

/** Forget what was learned only in this project; facts also seen in other projects are kept. */
export async function forgetProjectMemory(input: { projectId: string }) {
  const projectId = projectIdSchema.parse(input.projectId);
  const owner = await ownerOf(projectId);
  if ("error" in owner) return owner;
  const provider = await getMemoryProvider();
  if (!provider) return { removed: 0 };
  return { removed: await provider.forgetProject(owner.userId, projectId) };
}
