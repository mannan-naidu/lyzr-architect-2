"use client";

import { diffLines } from "diff";
import { FileCodeIcon, GitCompareIcon, PencilIcon, SaveIcon, XIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { saveFileByHand } from "../actions";
import { useWorkspace } from "../workspace-context";

/** File tree + code view. Pro mode adds per-file diffs (vs the previous version) and hand edits. */
export function CodePanel({ pro }: { pro: boolean }) {
  const { files, project, setFiles } = useWorkspace();
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"code" | "diff">("code");
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const file = files.find((f) => f.path === (selected ?? files.find((x) => x.path === "/App.tsx")?.path ?? files[0]?.path));
  const changed = useMemo(() => new Set(files.filter((f) => f.previous_content !== null && f.previous_content !== f.content).map((f) => f.path)), [files]);

  if (!files.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <FileCodeIcon className="size-8" /> No code yet. Approve a plan and build it.
      </div>
    );
  }

  const save = () =>
    startSave(async () => {
      if (!file || draft === null) return;
      const result = await saveFileByHand({ projectId: project.id, path: file.path, content: draft });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setFiles(files.map((f) => (f.path === file.path ? { path: f.path, content: draft } : { path: f.path, content: f.content })));
      setDraft(null);
      toast.success(`Saved ${file.path}`, { description: "Architect will build on your edit." });
    });

  return (
    <div className="flex h-full min-h-0">
      <nav aria-label="Files" className="w-52 shrink-0 overflow-y-auto border-r py-2">
        <span className="label-mono block px-3 pb-2 text-muted-foreground">Files</span>
        {files.map((f) => (
          <button
            key={f.path}
            type="button"
            onClick={() => {
              setSelected(f.path);
              setDraft(null);
            }}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-3 py-1 text-left font-mono text-xs hover:bg-muted",
              file?.path === f.path && "bg-muted text-foreground",
            )}
          >
            <span className="truncate">{f.path.slice(1)}</span>
            {changed.has(f.path) ? <span className="size-1.5 shrink-0 rounded-full bg-[var(--yellow)]" title="Changed in the last run" /> : null}
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-3 py-1.5">
          <span className="truncate font-mono text-xs">
            {file?.path}
            {file?.path.startsWith("/dist/") ? (
              <span className="label-mono ml-2 text-[var(--green)]">deploy output · what crawlers read</span>
            ) : null}
          </span>
          {pro && file ? (
            <div className="flex items-center gap-1">
              {draft === null ? (
                <>
                  <Button variant={view === "code" ? "secondary" : "ghost"} size="xs" onClick={() => setView("code")}>
                    <FileCodeIcon /> Code
                  </Button>
                  <Button
                    variant={view === "diff" ? "secondary" : "ghost"}
                    size="xs"
                    onClick={() => setView("diff")}
                    disabled={!changed.has(file.path)}
                  >
                    <GitCompareIcon /> Diff
                  </Button>
                  {file.path !== "/agents.ts" && !file.path.startsWith("/dist/") ? (
                    <Button variant="ghost" size="xs" onClick={() => setDraft(file.content)}>
                      <PencilIcon /> Edit by hand
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <Button variant="ghost" size="xs" onClick={() => setDraft(null)}>
                    <XIcon /> Cancel
                  </Button>
                  <Button size="xs" onClick={save} disabled={saving}>
                    <SaveIcon /> Save
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {file && draft !== null ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              aria-label={`Edit ${file.path}`}
              className="h-full w-full resize-none bg-transparent p-3 font-mono text-xs leading-5 outline-none"
            />
          ) : file && view === "diff" && pro ? (
            <DiffView before={file.previous_content ?? ""} after={file.content} />
          ) : file ? (
            <CodeView code={file.content} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CodeView({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <pre className="p-3 font-mono text-xs leading-5">
      {lines.map((line, i) => (
        <div key={i} className="flex">
          <span className="w-10 shrink-0 pr-3 text-right text-muted-foreground/50 select-none">{i + 1}</span>
          <span className="whitespace-pre">{line || " "}</span>
        </div>
      ))}
    </pre>
  );
}

function DiffView({ before, after }: { before: string; after: string }) {
  const parts = diffLines(before, after);
  return (
    <pre className="p-3 font-mono text-xs leading-5">
      {parts.flatMap((part, i) =>
        part.value
          .replace(/\n$/, "")
          .split("\n")
          .map((line, j) => (
            <div
              key={`${i}-${j}`}
              className={cn(
                "whitespace-pre px-2",
                part.added && "bg-[var(--green)]/12 text-[var(--green)]",
                part.removed && "bg-destructive/12 text-destructive line-through decoration-destructive/40",
              )}
            >
              {part.added ? "+ " : part.removed ? "- " : "  "}
              {line || " "}
            </div>
          )),
      )}
    </pre>
  );
}
