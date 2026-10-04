"use client";

import { CheckIcon, EyeIcon, LoaderIcon, MonitorIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useWorkspace } from "../workspace-context";
import { useBuild } from "./use-build";

// Sandpack touches `window` on mount, so render it client-side only.
const SandpackPreviewPane = dynamic(() => import("./sandpack-pane").then((m) => m.SandpackPane), {
  ssr: false,
  loading: () => <PreviewLoading label="Starting preview" />,
});

const SIZES = [
  { id: "desktop", icon: MonitorIcon, width: "100%" },
  { id: "tablet", icon: TabletIcon, width: "820px" },
  { id: "mobile", icon: SmartphoneIcon, width: "390px" },
] as const;

export function PreviewPanel() {
  const { files, build, planStatus, setActiveTab, filesVersion } = useWorkspace();
  const [size, setSize] = useState<(typeof SIZES)[number]["id"]>("desktop");
  const startBuild = useBuild();

  if (build.phase === "building") return <BuildProgress steps={build.steps} files={build.files} />;

  if (!files.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <EyeIcon className="size-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Nothing to preview yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {planStatus === "approved"
            ? "Your plan is approved. Build it to see the app here."
            : "Plan the app first. Architect builds it once you approve the plan."}
        </p>
        {build.phase === "error" ? <p className="text-sm text-destructive">{build.message}</p> : null}
        {planStatus === "approved" ? (
          <Button onClick={() => void startBuild()}>Build it</Button>
        ) : (
          <Button variant="outline" onClick={() => setActiveTab("plan")}>
            Go to the plan
          </Button>
        )}
      </div>
    );
  }

  const width = SIZES.find((s) => s.id === size)?.width ?? "100%";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="label-mono text-muted-foreground">Live preview · agents simulated</span>
        <div className="flex items-center gap-1">
          {SIZES.map(({ id, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon-sm"
              aria-label={`${id} width`}
              aria-pressed={size === id}
              onClick={() => setSize(id)}
              className={cn(size === id && "bg-muted")}
            >
              <Icon className="size-3.5" />
            </Button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-muted/30">
        <div className="h-full transition-[width]" style={{ width, maxWidth: "100%" }}>
          <SandpackPreviewPane key={filesVersion} files={files} />
        </div>
      </div>
    </div>
  );
}

function BuildProgress({ steps, files }: { steps: string[]; files: string[] }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-5 p-6">
      <span className="label-mono text-primary">Building your app</span>
      <ol className="space-y-2 text-sm">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            {i === steps.length - 1 && !files.length ? (
              <LoaderIcon className="size-4 animate-spin text-primary" />
            ) : (
              <CheckIcon className="size-4 text-[var(--green)]" />
            )}
            {s}
          </li>
        ))}
      </ol>
      {files.length ? (
        <div className="space-y-1.5 border bg-card p-3">
          <span className="label-mono text-muted-foreground">Files</span>
          {files.map((f, i) => (
            <div key={f} className="flex items-center gap-2 font-mono text-xs">
              {i === files.length - 1 ? (
                <LoaderIcon className="size-3 animate-spin text-primary" />
              ) : (
                <CheckIcon className="size-3 text-[var(--green)]" />
              )}
              {f}
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">You can keep chatting while it builds.</p>
    </div>
  );
}

export function PreviewLoading({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoaderIcon className="size-4 animate-spin" /> {label}
    </div>
  );
}
