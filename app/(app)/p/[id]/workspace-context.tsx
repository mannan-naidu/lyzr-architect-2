"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { Plan } from "@/lib/build/schemas";
import type { WorkspaceFile } from "@/lib/build/types";
import type { AppMode, Decision, FixAttempt, PlanStatus, RunEvent } from "@/lib/types/database";

export type WorkspaceData = {
  project: {
    id: string;
    name: string;
    description: string | null;
    framework: string;
    mode: AppMode;
    memory_enabled: boolean;
    seo_enabled: boolean;
    cms_enabled: boolean;
    github_repo: string | null;
    deploy_slug: string | null;
  };
  plan: Plan | null;
  planStatus: PlanStatus;
  files: (WorkspaceFile & { previous_content: string | null; updated_at: string })[];
  decisions: Decision[];
  events: RunEvent[];
  fixes: FixAttempt[];
  /** Fair-billing ledger: every model call with its tokens and who pays for it. */
  ledger: LedgerRow[];
};

export type LedgerRow = {
  id: string;
  kind: "chat" | "plan" | "build" | "fix";
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  billed_to: "user" | "agent";
  created_at: string;
};

type BuildState =
  | { phase: "idle" }
  | { phase: "building"; steps: string[]; files: string[] }
  | { phase: "error"; message: string };

type Ctx = WorkspaceData & {
  modelId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setPlan: (plan: Plan | null, status: PlanStatus) => void;
  setFiles: (files: WorkspaceFile[]) => void;
  build: BuildState;
  setBuild: (b: BuildState) => void;
  /** Bumped whenever files change so the preview remounts with the new code. */
  filesVersion: number;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({
  data,
  modelId,
  children,
}: {
  data: WorkspaceData;
  modelId: string;
  children: ReactNode;
}) {
  const [plan, setPlanState] = useState(data.plan);
  const [planStatus, setPlanStatus] = useState(data.planStatus);
  const [files, setFilesState] = useState(data.files);
  const [filesVersion, setFilesVersion] = useState(0);
  const [build, setBuild] = useState<BuildState>({ phase: "idle" });
  const [activeTab, setActiveTab] = useState(data.files.length ? "preview" : "plan");

  const setPlan = useCallback((p: Plan | null, s: PlanStatus) => {
    setPlanState(p);
    setPlanStatus(s);
  }, []);

  const setFiles = useCallback((next: WorkspaceFile[]) => {
    setFilesState((prev) => {
      const before = new Map(prev.map((f) => [f.path, f.content]));
      const now = new Date().toISOString();
      return next.map((f) => ({
        ...f,
        previous_content: before.get(f.path) !== f.content ? (before.get(f.path) ?? null) : (prev.find((p) => p.path === f.path)?.previous_content ?? null),
        updated_at: now,
      }));
    });
    setFilesVersion((v) => v + 1);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...data,
      plan,
      planStatus,
      files,
      modelId,
      activeTab,
      setActiveTab,
      setPlan,
      setFiles,
      build,
      setBuild,
      filesVersion,
    }),
    [data, plan, planStatus, files, modelId, activeTab, setPlan, setFiles, build, filesVersion],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): Ctx {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

/** Parse an error body from our API routes into a readable message. */
export async function readApiError(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") return body.error;
  } catch {
    // fall through
  }
  return `Request failed (${res.status}).`;
}
