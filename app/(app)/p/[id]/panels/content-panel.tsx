"use client";

import { DownloadIcon, FileTextIcon, LoaderIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CmsEntry } from "@/lib/types/database";
import { cn } from "@/lib/utils";

import { deleteCmsEntry, importFromWordPress, listCmsEntries, saveCmsEntry } from "../ship-actions";
import { useWorkspace } from "../workspace-context";

type Collection = CmsEntry["collection"];
type Draft = { id?: string; collection: Collection; slug: string; title: string; body: string; status: CmsEntry["status"] };

const COLLECTIONS: { value: Collection; label: string }[] = [
  { value: "pages", label: "Pages" },
  { value: "posts", label: "Posts" },
  { value: "faqs", label: "FAQs" },
];

const empty = (collection: Collection): Draft => ({ collection, slug: "", title: "", body: "", status: "draft" });

/** Content mode: a WordPress-style editor for pages, posts and FAQs, with WordPress import. */
export function ContentPanel() {
  const { project } = useWorkspace();
  const [entries, setEntries] = useState<CmsEntry[] | null>(null);
  const [collection, setCollection] = useState<Collection>("pages");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [site, setSite] = useState("");
  const [busy, start] = useTransition();

  const load = useCallback(async () => {
    const r = await listCmsEntries({ projectId: project.id });
    if ("error" in r) toast.error(r.error);
    else setEntries(r.entries);
  }, [project.id]);

  useEffect(() => {
    let live = true;
    listCmsEntries({ projectId: project.id })
      .then((r) => {
        if (live) setEntries("entries" in r ? r.entries : []);
      })
      .catch(() => {
        if (live) setEntries([]);
      });
    return () => {
      live = false;
    };
  }, [project.id]);

  const save = () =>
    start(async () => {
      if (!draft) return;
      const result = await saveCmsEntry({ projectId: project.id, ...draft });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Saved “${draft.title}”`);
      setDraft(null);
      await load();
    });

  const importWp = () =>
    start(async () => {
      const result = await importFromWordPress({ projectId: project.id, siteUrl: site });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Imported ${result.imported} entries from WordPress`);
      setSite("");
      await load();
    });

  const shown = (entries ?? []).filter((e) => e.collection === collection);

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="label-mono text-primary">Content mode</span>
          <h2 className="text-xl font-semibold">Pages, posts and FAQs</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Edit content without touching code. Published FAQs become FAQ structured data, so AI answer engines can quote
            them.
          </p>
        </div>
        <form
          className="flex w-full max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (site.trim()) importWp();
          }}
        >
          <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://your-wordpress.site" aria-label="WordPress site URL" />
          <Button type="submit" variant="outline" disabled={busy || !site.trim()}>
            {busy ? <LoaderIcon className="animate-spin" /> : <DownloadIcon />} Import
          </Button>
        </form>
      </div>

      <div className="flex items-center gap-1 border-b pb-2">
        {COLLECTIONS.map((c) => (
          <Button key={c.value} size="sm" variant={collection === c.value ? "secondary" : "ghost"} onClick={() => setCollection(c.value)}>
            {c.label}
            <span className="label-mono text-muted-foreground">{(entries ?? []).filter((e) => e.collection === c.value).length}</span>
          </Button>
        ))}
        <Button size="sm" className="ml-auto" onClick={() => setDraft(empty(collection))}>
          <PlusIcon /> New
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ul className="divide-y border">
          {entries === null ? (
            <li className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <LoaderIcon className="size-3.5 animate-spin" /> Loading…
            </li>
          ) : shown.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">Nothing here yet. Create one, or import from WordPress.</li>
          ) : (
            shown.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setDraft({ id: e.id, collection: e.collection, slug: e.slug, title: e.title, body: e.body, status: e.status })}
                  className={cn("flex w-full items-center gap-2 p-3 text-left hover:bg-muted", draft?.id === e.id && "bg-muted")}
                >
                  <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
                  <span className={cn("label-mono", e.status === "published" ? "text-[var(--green)]" : "text-muted-foreground")}>
                    {e.status}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        {draft ? (
          <form
            className="space-y-3 border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <Input
              value={draft.title}
              onChange={(e) => {
                const title = e.target.value;
                setDraft({
                  ...draft,
                  title,
                  slug: draft.id ? draft.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80),
                });
              }}
              placeholder={draft.collection === "faqs" ? "Question" : "Title"}
              aria-label="Title"
              required
            />
            <Input
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              placeholder="slug"
              aria-label="Slug"
              className="font-mono text-xs"
              required
            />
            <Textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder={draft.collection === "faqs" ? "Answer" : "Content (HTML or text)"}
              aria-label="Body"
              rows={10}
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={draft.status === "published"}
                  onChange={(e) => setDraft({ ...draft, status: e.target.checked ? "published" : "draft" })}
                />
                Published
              </label>
              {draft.id ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-destructive"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      if (!draft.id) return;
                      const r = await deleteCmsEntry({ projectId: project.id, id: draft.id });
                      if ("error" in r) toast.error(r.error);
                      setDraft(null);
                      await load();
                    })
                  }
                >
                  <Trash2Icon /> Delete
                </Button>
              ) : null}
              <Button type="submit" size="sm" disabled={busy} className={draft.id ? "" : "ml-auto"}>
                <SaveIcon /> Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-center border border-dashed p-8 text-sm text-muted-foreground">
            Select an entry to edit it.
          </div>
        )}
      </div>
    </div>
  );
}
