"use client";

import { CheckIcon, PencilIcon, RotateCcwIcon, SearchIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type FrameworkCode = { id: string; label: string; filename: string; withMemory: string; withoutMemory: string };

const PILLARS = [
  { id: "found", n: "01", title: "Get found", body: "SEO + GEO from the first build: real HTML, structured data and llms.txt, so Google ranks it and AI answer engines quote it." },
  { id: "remember", n: "02", title: "Remember", body: "Lyzr Cognis memory learns how you build across projects. See it, edit it, delete it." },
  { id: "agents", n: "03", title: "Run any agent", body: "One agent spec compiles to Lyzr, LangGraph, CrewAI, OpenAI Agents or TypeScript. Memory is one switch." },
] as const;

type PillarId = (typeof PILLARS)[number]["id"];
const AUTOPLAY_MS = 7000;

/** "Get found · Remember · Run any agent": tabs that autoplay until you pick one, each with a live mini demo. */
export function Pillars({ frameworks }: { frameworks: FrameworkCode[] }) {
  const [active, setActive] = useState<PillarId>("found");
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      const i = PILLARS.findIndex((p) => p.id === active);
      setActive(PILLARS[(i + 1) % PILLARS.length]!.id);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [active, autoplay]);

  const pick = (id: PillarId) => {
    setAutoplay(false);
    setActive(id);
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div role="tablist" aria-label="What Architect does" className="flex flex-col border-b lg:border-r lg:border-b-0">
        {PILLARS.map((p) => {
          const on = p.id === active;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={on}
              onClick={() => pick(p.id)}
              className={cn(
                "group relative space-y-2 border-b p-6 text-left transition-colors last:border-b-0",
                on ? "bg-card" : "hover:bg-card/60",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("label-mono", on ? "text-primary" : "text-muted-foreground")}>{p.n}</span>
                {on && autoplay ? <span className="label-mono text-muted-foreground/70">auto</span> : null}
              </div>
              <h3 className={cn("text-2xl font-semibold transition-colors", !on && "text-foreground/60 group-hover:text-foreground")}>
                {p.title}
              </h3>
              <p className={cn("text-sm text-muted-foreground transition-all", on ? "opacity-100" : "opacity-70")}>{p.body}</p>
              {/* Progress line: fills while autoplay holds this tab. */}
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
                {on ? (
                  <span
                    key={`${active}-${autoplay}`}
                    className={cn(
                      "block h-full origin-left bg-primary",
                      autoplay ? "animate-[grow-x_linear_both] motion-reduce:animate-none" : "",
                    )}
                    style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="min-h-[420px] p-6 sm:p-8" key={active}>
        {active === "found" ? <FoundDemo /> : active === "remember" ? <RememberDemo /> : <AgentsDemo frameworks={frameworks} />}
      </div>
    </div>
  );
}

/* ── Get found ─────────────────────────────────────────────────────────────────────────────── */

const SEO_CHECKS = ["All content in HTML on first load", "Title, meta and Open Graph tags", "JSON-LD structured data", "sitemap.xml + robots.txt", "llms.txt for AI crawlers"];

function useCountUp(target: number, ms = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = duration ? Math.min(1, (t - start) / duration) : 1;
      setN(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

function FoundDemo() {
  const score = useCountUp(96);
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <div className="space-y-3">
        <div className="animate-[pop-in_0.5s_ease_both] border bg-card p-4">
          <span className="label-mono flex items-center gap-1.5 text-muted-foreground">
            <SearchIcon className="size-3" /> Google · yoga classes near me
          </span>
          <p className="mt-2 text-xs text-muted-foreground">yogaflow.architect.run</p>
          <p className="text-base font-medium text-primary">Yoga Flow Studio: beginner to advanced classes</p>
          <p className="text-sm text-muted-foreground">Morning and evening classes, drop-in pricing and a free first session…</p>
        </div>
        <div className="animate-[pop-in_0.5s_ease_both] border bg-card p-4 [animation-delay:250ms]">
          <span className="label-mono flex items-center gap-1.5 text-muted-foreground">
            <SparklesIcon className="size-3" /> AI answer · &ldquo;best beginner yoga studio?&rdquo;
          </span>
          <p className="mt-2 text-sm">
            Yoga Flow Studio runs beginner classes every weekday at 7am, and your first session is free.
            <span className="label-mono ml-1.5 border px-1 py-0.5 text-[10px] text-primary">yogaflow.architect.run</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:w-56">
        <div className="border bg-card p-4 text-center">
          <span className="label-mono text-muted-foreground">SEO + GEO score</span>
          <p className="font-wide text-5xl font-bold tabular-nums">{score}</p>
          <div className="mt-2 h-1 bg-border">
            <div className="h-full bg-[var(--green)] transition-[width] duration-100" style={{ width: `${score}%` }} />
          </div>
        </div>
        <ul className="space-y-1.5 text-xs">
          {SEO_CHECKS.map((c, i) => (
            <li key={c} className="flex animate-[pop-in_0.4s_ease_both] items-start gap-2" style={{ animationDelay: `${400 + i * 180}ms` }}>
              <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-[var(--green)]" /> {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Remember ──────────────────────────────────────────────────────────────────────────────── */

const MEMORIES = [
  { id: 1, tag: "Preference", text: "Dark theme, minimal style, dense dashboards" },
  { id: 2, tag: "Stack", text: "Deploys to Vercel; Supabase for data" },
  { id: 3, tag: "Decision", text: "No sign-in for v1 of public sites" },
  { id: 4, tag: "Fix", text: "Agent import path: ../agents from components (cause: wrong relative path)" },
];

function RememberDemo() {
  const [items, setItems] = useState(MEMORIES);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label-mono text-primary">Recalled {items.length} for &ldquo;yoga studio site&rdquo;</span>
        <span className="label-mono text-muted-foreground">Lyzr Cognis · vector + keyword search</span>
      </div>
      <ul className="space-y-2">
        {items.map((m, i) => (
          <li
            key={m.id}
            className="group flex animate-[pop-in_0.45s_ease_both] items-center gap-3 border bg-card p-3"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <span className="label-mono w-20 shrink-0 text-muted-foreground">{m.tag}</span>
            {editing === m.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setItems((all) => all.map((x) => (x.id === m.id ? { ...x, text: draft.trim() || x.text } : x)));
                  setEditing(null);
                }}
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-w-0 flex-1 border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                  aria-label="Edit memory"
                />
                <button type="submit" className="label-mono border px-2 text-primary hover:bg-primary/10">
                  Save
                </button>
              </form>
            ) : (
              <span className="min-w-0 flex-1 text-sm">{m.text}</span>
            )}
            {editing === m.id ? null : (
              <span className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                <button
                  aria-label="Edit memory"
                  onClick={() => {
                    setEditing(m.id);
                    setDraft(m.text);
                  }}
                  className="p-1 hover:text-primary"
                >
                  <PencilIcon className="size-3.5" />
                </button>
                <button
                  aria-label="Delete memory"
                  onClick={() => setItems((all) => all.filter((x) => x.id !== m.id))}
                  className="p-1 hover:text-[var(--red)]"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {items.length < MEMORIES.length ? (
        <button onClick={() => setItems(MEMORIES)} className="label-mono flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <RotateCcwIcon className="size-3" /> Restore demo memories
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">Try it: edit or delete a memory. In Architect, every change is saved as a new version.</p>
      )}
    </div>
  );
}

/* ── Run any agent ─────────────────────────────────────────────────────────────────────────── */

function AgentsDemo({ frameworks }: { frameworks: FrameworkCode[] }) {
  const [fw, setFw] = useState(frameworks[0]?.id ?? "lyzr");
  const [memory, setMemory] = useState(true);
  const current = frameworks.find((f) => f.id === fw) ?? frameworks[0];
  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {frameworks.map((f) => (
          <button
            key={f.id}
            onClick={() => setFw(f.id)}
            className={cn(
              "label-mono border px-2.5 py-1.5 transition-colors",
              f.id === fw ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground/40",
            )}
          >
            {f.label}
          </button>
        ))}
        <label className="label-mono ml-auto flex cursor-pointer items-center gap-2 text-muted-foreground">
          Memory
          <button
            role="switch"
            aria-checked={memory}
            onClick={() => setMemory((m) => !m)}
            className={cn("relative h-5 w-9 border transition-colors", memory ? "border-primary bg-primary" : "bg-muted")}
          >
            <span className={cn("absolute top-0.5 size-3.5 bg-[var(--paper)] transition-all", memory ? "left-[18px]" : "left-0.5")} />
          </button>
        </label>
      </div>
      <div className="border bg-[var(--ink)] text-[var(--paper)]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span className="label-mono text-white/60">{current.filename}</span>
          <span className="label-mono text-white/40">same spec · {current.label}</span>
        </div>
        <pre key={`${fw}-${memory}`} className="max-h-72 animate-[pop-in_0.35s_ease_both] overflow-auto p-4 font-mono text-[11.5px] leading-relaxed">
          {memory ? current.withMemory : current.withoutMemory}
        </pre>
      </div>
      <p className="text-xs text-muted-foreground">Real output of Architect&rsquo;s compiler for a one-agent yoga studio app.</p>
    </div>
  );
}
