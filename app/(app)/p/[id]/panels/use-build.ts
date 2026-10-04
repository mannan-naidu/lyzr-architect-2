"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import type { BuildEvent } from "@/lib/build/types";

import { readApiError, useWorkspace } from "../workspace-context";

/** Starts a build and feeds the streamed NDJSON events into workspace state. */
export function useBuild() {
  const { project, modelId, setBuild, setFiles, setActiveTab } = useWorkspace();
  const router = useRouter();

  return useCallback(async () => {
    setActiveTab("preview");
    setBuild({ phase: "building", steps: ["Starting build"], files: [] });
    const res = await fetch(`/api/projects/${project.id}/build`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ modelId }),
    });
    if (!res.ok || !res.body) {
      const message = await readApiError(res);
      setBuild({ phase: "error", message });
      toast.error(message);
      return;
    }

    const steps: string[] = [];
    const files: string[] = [];
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as BuildEvent;
        switch (event.type) {
          case "status":
            steps.push(event.message);
            break;
          case "recall":
            steps.push(`Remembered: ${event.memories.slice(0, 2).join(" · ")}`);
            break;
          case "file-start":
            files.push(event.path);
            break;
          case "done":
            setFiles(event.files);
            setBuild({ phase: "idle" });
            router.refresh(); // pull the new trace, decisions and ledger rows
            toast.success("Your app is built", {
              description: `${event.files.length} files · ${(event.usage.inputTokens + event.usage.outputTokens).toLocaleString()} tokens`,
            });
            return;
          case "error":
            setBuild({ phase: "error", message: event.message });
            toast.error(event.message);
            return;
        }
        setBuild({ phase: "building", steps: [...steps], files: [...files] });
      }
    }
  }, [project.id, modelId, setBuild, setFiles, setActiveTab, router]);
}
