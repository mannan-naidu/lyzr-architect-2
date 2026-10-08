"use client";

import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useErrorMessage,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { BrainIcon, LoaderIcon, WrenchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { fixAgentImports } from "@/lib/build/agents-runtime";
import type { FixResponse, WorkspaceFile } from "@/lib/build/types";

import { readApiError, useWorkspace } from "../workspace-context";

const TAILWIND_CDN = "https://cdn.tailwindcss.com";

/**
 * Entry point injected into every preview. Besides mounting the app, it posts the rendered body
 * HTML to the workspace once the first render settles: the pre-render snapshot that SEO + GEO
 * ships as static index.html, and that the SEO report audits (what a crawler actually gets).
 */
const ENTRY = `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const el = document.getElementById("root")!;
createRoot(el).render(<StrictMode><App /></StrictMode>);

setTimeout(() => {
  window.parent.postMessage({ type: "architect:snapshot", html: el.innerHTML }, "*");
}, 1500);
`;

/** Files Architect produces for deploys (e.g. /dist/index.html) never enter the sandbox. */
const isDeployArtifact = (path: string) => path.startsWith("/dist/");

export function SandpackPane({ files }: { files: WorkspaceFile[] }) {
  const { setSnapshot } = useWorkspace();
  const sandpackFiles = useMemo(
    () => ({
      // fixAgentImports also repairs projects built before the server-side fix existed.
      ...Object.fromEntries(
        fixAgentImports(files.filter((f) => !isDeployArtifact(f.path))).map((f) => [f.path, { code: f.content }]),
      ),
      "/index.tsx": { code: ENTRY, hidden: true },
    }),
    [files],
  );

  // Receive the snapshot from the sandbox iframe (Sandpack's bundler runs on *.codesandbox.io).
  useEffect(() => {
    const onMessage = (e: MessageEvent<unknown>) => {
      let host: string;
      try {
        host = new URL(e.origin).hostname;
      } catch {
        return;
      }
      if (!host.endsWith(".codesandbox.io")) return;
      const data = e.data;
      if (!data || typeof data !== "object" || !("type" in data) || data.type !== "architect:snapshot") return;
      if ("html" in data && typeof data.html === "string") setSnapshot(data.html.slice(0, 400_000));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setSnapshot]);

  return (
    <SandpackProvider
      template="react-ts"
      files={sandpackFiles}
      theme="dark"
      options={{ externalResources: [TAILWIND_CDN], recompileMode: "delayed", recompileDelay: 400 }}
      style={{ height: "100%" }}
    >
      <SandpackLayout style={{ height: "100%", border: 0, borderRadius: 0 }}>
        <div className="relative flex h-full w-full flex-col">
          <SandpackPreview
            style={{ height: "100%" }}
            showOpenInCodeSandbox={false}
            showRefreshButton
          />
          <FixBanner />
        </div>
      </SandpackLayout>
    </SandpackProvider>
  );
}

type FixState =
  | { phase: "idle" }
  | { phase: "fixing" }
  | { phase: "verifying"; signature: string; summary: string; knownFix: string | null }
  | { phase: "question"; question: string };

/** Shows preview errors with a free, memory-aware "Fix it", and confirms fixes that worked. */
function FixBanner() {
  const error = useErrorMessage();
  const { sandpack } = useSandpack();
  const { project, modelId, setFiles } = useWorkspace();
  const [fix, setFix] = useState<FixState>({ phase: "idle" });
  const reported = useRef<string | null>(null);
  const router = useRouter();

  // After a fix, a clean render for a few seconds marks it as succeeded in fix memory.
  useEffect(() => {
    if (fix.phase !== "verifying" || error || sandpack.status !== "running") return;
    if (reported.current === fix.signature) return;
    const timer = window.setTimeout(() => {
      reported.current = fix.signature;
      void fetch(`/api/projects/${project.id}/fix/outcome`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature: fix.signature, outcome: "succeeded" }),
      });
      router.refresh();
      toast.success("Fix confirmed and remembered", {
        description: "If this error ever comes back, in any project, Architect will reuse this fix.",
      });
      setFix({ phase: "idle" });
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [fix, error, sandpack.status, project.id, router]);

  const runFix = async () => {
    if (!error) return;
    setFix({ phase: "fixing" });
    const res = await fetch(`/api/projects/${project.id}/fix`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ modelId, error }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      setFix({ phase: "idle" });
      return;
    }
    const body = (await res.json()) as FixResponse;
    setFiles(body.files);
    router.refresh();
    if (body.status === "loop_broken") {
      setFix({ phase: "question", question: body.question });
      toast.warning("Stopped after 3 failed fixes", { description: "Rolled back to the last working version." });
      return;
    }
    toast.success(`Fix ${body.attempt}: ${body.summary}`, {
      description: body.usedKnownFix && body.knownFix
        ? `Same cause as a fix that worked on ${body.knownFix.when}, so it was reused. Free.`
        : `Cause: ${body.diagnosis} Self-fix, not billed to you.`,
    });
    setFix({ phase: "verifying", signature: body.signature, summary: body.summary, knownFix: body.knownFix?.summary ?? null });
  };

  if (fix.phase === "question") {
    return (
      <Banner tone="warn">
        <p className="text-sm">
          <span className="label-mono block">Loop breaker</span>
          {fix.question}
        </p>
        <Button size="sm" variant="outline" onClick={() => setFix({ phase: "idle" })}>
          Got it
        </Button>
      </Banner>
    );
  }

  if (!error) {
    return fix.phase === "verifying" ? (
      <Banner tone="info">
        <p className="flex items-center gap-2 text-sm">
          <LoaderIcon className="size-3.5 animate-spin" /> Checking the fix: {fix.summary}
        </p>
      </Banner>
    ) : null;
  }

  return (
    <Banner tone="error">
      <p className="min-w-0 text-sm">
        <span className="label-mono block">Preview error</span>
        <span className="line-clamp-2 font-mono text-xs">{error}</span>
      </p>
      <Button size="sm" onClick={() => void runFix()} disabled={fix.phase === "fixing"}>
        {fix.phase === "fixing" ? <LoaderIcon className="animate-spin" /> : <WrenchIcon />}
        {fix.phase === "fixing" ? "Checking fix memory…" : "Fix it · free"}
      </Button>
      <span className="label-mono hidden items-center gap-1 text-muted-foreground lg:inline-flex">
        <BrainIcon className="size-3" /> reuses past fixes
      </span>
    </Banner>
  );
}

function Banner({ tone, children }: { tone: "error" | "warn" | "info"; children: React.ReactNode }) {
  const border = tone === "error" ? "border-destructive/60" : tone === "warn" ? "border-[var(--yellow)]/60" : "border-primary/50";
  return (
    <div className={`absolute inset-x-3 bottom-3 z-10 flex items-center gap-3 border ${border} bg-popover/95 p-3 shadow-lg backdrop-blur`}>
      {children}
    </div>
  );
}
