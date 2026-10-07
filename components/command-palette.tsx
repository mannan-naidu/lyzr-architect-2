"use client";

import {
  ArrowRightIcon,
  CompassIcon,
  FolderIcon,
  LayoutGridIcon,
  LogOutIcon,
  MessageSquareIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  SunIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TOUR_EVENT } from "@/components/product-tour";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FEATURES,
  OPEN_FEATURE_EVENT,
  searchFeatures,
  type Feature,
  type OpenFeatureDetail,
} from "@/lib/features";

export type PaletteProject = { id: string; name: string };

/** Shown before the user types: the features people look for most. */
const SUGGESTED = ["memory", "ledger", "plan", "deploy", "github", "frameworks"];

/**
 * ⌘K / Ctrl+K: search Architect's features (and jump straight to them), projects and commands.
 * Prototype ranking is text matching (lib/features.ts); production adds semantic search.
 */
export function CommandPalette({ projects }: { projects: PaletteProject[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  // A workspace on screen marks itself with data-workspace-id (more robust than parsing the URL).
  const currentProject = () =>
    document.querySelector("[data-workspace-id]")?.getAttribute("data-workspace-id") ??
    pathname.match(/^\/p\/([0-9a-f-]{36})/)?.[1] ??
    null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const featureHits = useMemo(
    () =>
      query.trim()
        ? searchFeatures(query).map((h) => h.feature)
        : SUGGESTED.map((id) => FEATURES.find((f) => f.id === id)).filter((f): f is Feature => Boolean(f)),
    [query],
  );
  const q = query.trim().toLowerCase();
  const projectHits = projects.filter((p) => !q || p.name.toLowerCase().includes(q)).slice(0, 6);
  const commandMatches = (label: string) => !q || label.toLowerCase().includes(q);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const openInWorkspace = (detail: OpenFeatureDetail) => {
    if (currentProject()) {
      window.dispatchEvent(new CustomEvent<OpenFeatureDetail>(OPEN_FEATURE_EVENT, { detail }));
      return;
    }
    const latest = projects[0];
    if (!latest) {
      toast.info("Create a project first", { description: "Features live inside a project's workspace." });
      router.push("/dashboard?new=1");
      return;
    }
    const params = new URLSearchParams();
    if (detail.tab) params.set("tab", detail.tab);
    if (detail.view) params.set("view", detail.view);
    if (detail.pro) params.set("pro", "1");
    router.push(`/p/${latest.id}?${params}`);
  };

  const goTo = (feature: Feature) => {
    close();
    const t = feature.target;
    switch (t.kind) {
      case "tab":
        openInWorkspace({ tab: t.tab, view: t.view, pro: t.pro });
        return;
      case "route":
        router.push(t.href);
        return;
      case "action":
        if (t.action === "tour") window.dispatchEvent(new Event(TOUR_EVENT));
        else if (t.action === "theme") setTheme(resolvedTheme === "light" ? "dark" : "light");
        else openInWorkspace({ pro: true });
        return;
      case "element": {
        if (!currentProject()) {
          openInWorkspace({});
          return;
        }
        // Wait for the dialog to close and focus to return before focusing the target.
        window.setTimeout(() => {
          const el = document.querySelector<HTMLElement>(t.selector);
          if (!el) return;
          el.scrollIntoView({ block: "center" });
          if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
            el.focus();
          } else {
            el.focus();
            // Radix menus open on pointerdown; plain buttons on click. Send both.
            el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }));
            if (el.getAttribute("aria-haspopup") !== "menu") el.click();
          }
        }, 250);
        return;
      }
    }
  };

  const run = (fn: () => void) => {
    close();
    fn();
  };

  const signOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-tour="command-palette"
        className="hidden w-64 justify-between text-muted-foreground sm:flex"
      >
        <span className="flex items-center gap-2">
          <SearchIcon className="size-3.5" /> Search features, projects…
        </span>
        <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : close())}
        title="Search"
        description="Search Architect's features, your projects and commands"
        className="sm:max-w-xl"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search features… try “cost”, “deploy”, “wordpress”, “undo”"
          />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>No results.</CommandEmpty>
            {q && !featureHits.length ? (
              <div className="space-y-1 px-3 py-3 text-sm">
                <p>No feature matches &ldquo;{query}&rdquo;.</p>
                <p className="text-xs text-muted-foreground">
                  Search matches words for now (semantic search is planned). Try a shorter word, or ask Architect below.
                </p>
              </div>
            ) : null}

            {featureHits.length ? (
              <CommandGroup heading={q ? "Features" : "Suggested features"}>
                {featureHits.map((f) => (
                  <CommandItem key={f.id} value={`feature-${f.id}`} onSelect={() => goTo(f)} className="items-start gap-3 py-2">
                    <SparklesIcon className="mt-0.5 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{f.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{f.summary}</span>
                      <span className="label-mono mt-0.5 block text-[10px] text-muted-foreground/80">{f.where}</span>
                    </span>
                    <ArrowRightIcon className="mt-0.5 opacity-50" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {projectHits.length ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Projects">
                  {projectHits.map((p) => (
                    <CommandItem key={p.id} value={`project-${p.id}`} onSelect={() => run(() => router.push(`/p/${p.id}`))}>
                      <FolderIcon /> {p.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            <CommandSeparator />
            <CommandGroup heading="Commands">
              {commandMatches("new project") ? (
                <CommandItem value="cmd-new" onSelect={() => run(() => router.push("/dashboard?new=1"))}>
                  <PlusIcon /> New project
                </CommandItem>
              ) : null}
              {commandMatches("all projects dashboard") ? (
                <CommandItem value="cmd-all" onSelect={() => run(() => router.push("/dashboard"))}>
                  <LayoutGridIcon /> All projects
                </CommandItem>
              ) : null}
              {q ? (
                <CommandItem
                  value="cmd-ask"
                  onSelect={() =>
                    run(() => {
                      const box = document.querySelector<HTMLTextAreaElement>('[data-tour="chat-input"] textarea');
                      if (box) {
                        box.focus();
                        toast.info("Ask Architect in the chat", { description: query });
                      } else openInWorkspace({});
                    })
                  }
                >
                  <MessageSquareIcon /> Ask Architect about &ldquo;{query}&rdquo;
                </CommandItem>
              ) : null}
              {commandMatches("take the quick tour help") ? (
                <CommandItem value="cmd-tour" onSelect={() => run(() => window.dispatchEvent(new Event(TOUR_EVENT)))}>
                  <CompassIcon /> Take the quick tour
                </CommandItem>
              ) : null}
              {commandMatches("toggle theme dark light") ? (
                <CommandItem value="cmd-theme" onSelect={() => run(() => setTheme(resolvedTheme === "light" ? "dark" : "light"))}>
                  {resolvedTheme === "light" ? <MoonIcon /> : <SunIcon />} Toggle theme
                </CommandItem>
              ) : null}
              {commandMatches("sign out log out") ? (
                <CommandItem value="cmd-signout" onSelect={() => run(() => void signOut())}>
                  <LogOutIcon /> Sign out
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
