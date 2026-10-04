"use client";

import { FolderIcon, LayoutGridIcon, LogOutIcon, MoonIcon, PlusIcon, SearchIcon, SunIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export type PaletteProject = { id: string; name: string };

/** ⌘K / Ctrl+K: jump to a project, start a new one, switch theme, sign out. */
export function CommandPalette({ projects }: { projects: PaletteProject[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

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

  const run = (fn: () => void) => {
    setOpen(false);
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
        className="hidden w-56 justify-between text-muted-foreground sm:flex"
      >
        <span className="flex items-center gap-2">
          <SearchIcon className="size-3.5" /> Search or jump to…
        </span>
        <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Jump to a project or run a command">
        <CommandInput placeholder="Type a command or project name…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run(() => router.push("/dashboard?new=1"))}>
              <PlusIcon /> New project
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push("/dashboard"))}>
              <LayoutGridIcon /> All projects
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme(resolvedTheme === "light" ? "dark" : "light"))}>
              {resolvedTheme === "light" ? <MoonIcon /> : <SunIcon />} Toggle theme
            </CommandItem>
          </CommandGroup>
          {projects.length ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Projects">
                {projects.map((p) => (
                  <CommandItem key={p.id} value={`project ${p.name}`} onSelect={() => run(() => router.push(`/p/${p.id}`))}>
                    <FolderIcon /> {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem onSelect={() => run(() => void signOut())}>
              <LogOutIcon /> Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
