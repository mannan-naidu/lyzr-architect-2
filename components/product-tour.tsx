"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export type TourStep = {
  /** Matches an element's `data-tour` attribute. Steps whose target isn't on screen are skipped. */
  target: string;
  title: string;
  body: string;
};

const STORAGE_KEY = "architect.tour.v1.done";
/** Fire `window.dispatchEvent(new Event(TOUR_EVENT))` to replay the tour (e.g. from ⌘K). */
export const TOUR_EVENT = "architect:start-tour";

const PAD = 6;
const CARD_W = 320;

type Rect = { top: number; left: number; width: number; height: number };

function readDone(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markDone() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // private mode etc. — the tour just shows again next time
  }
}

/**
 * Lightweight spotlight tour: dims the page, highlights one element at a time and explains it.
 * Runs once on first visit (remembered in localStorage) and can be replayed on demand.
 */
export function ProductTour({ steps }: { steps: TourStep[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const visibleSteps = useCallback(
    () => steps.filter((s) => document.querySelector(`[data-tour="${s.target}"]`)),
    [steps],
  );
  const [active, setActive] = useState<TourStep[]>([]);

  const start = useCallback(() => {
    const list = visibleSteps();
    if (!list.length) return;
    setActive(list);
    setIndex(0);
  }, [visibleSteps]);

  const finish = useCallback(() => {
    markDone();
    setIndex(null);
  }, []);

  // Auto-start on first visit; replay on demand.
  useEffect(() => {
    const timer = readDone() ? undefined : window.setTimeout(start, 600);
    window.addEventListener(TOUR_EVENT, start);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener(TOUR_EVENT, start);
    };
  }, [start]);

  const step = index === null ? null : active[index];

  useLayoutEffect(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : Math.min(i + 1, active.length - 1)));
      if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, active.length, finish]);

  if (index === null || !step || !rect) return null;

  const last = index === active.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Prefer below, then above; tall targets (e.g. the whole chat panel) get the card beside them.
  const CARD_H = 190;
  const fitsBelow = rect.top + rect.height + 12 + CARD_H < vh;
  const fitsAbove = rect.top - 12 - CARD_H > 0;
  const fitsRight = rect.left + rect.width + 12 + CARD_W < vw;
  let cardTop: number;
  let cardLeft: number;
  if (fitsBelow || fitsAbove) {
    cardTop = fitsBelow ? rect.top + rect.height + 12 : rect.top - 12 - CARD_H;
    cardLeft = Math.min(Math.max(12, rect.left), vw - CARD_W - 12);
  } else {
    cardTop = Math.min(Math.max(12, rect.top + 24), vh - CARD_H - 12);
    cardLeft = fitsRight ? rect.left + rect.width + 12 : Math.max(12, rect.left - CARD_W - 12);
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Spotlight: a transparent box whose huge shadow dims everything else. */}
      <div
        className="pointer-events-none absolute border-2 border-primary transition-all duration-200"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          boxShadow: "0 0 0 9999px oklch(0.12 0.01 188 / 0.72)",
        }}
      />
      <div
        className="chamfer-lg absolute border bg-popover p-4 text-popover-foreground shadow-xl"
        style={{ top: cardTop, left: cardLeft, width: CARD_W }}
      >
        <div className="flex items-center justify-between">
          <span className="label-mono text-primary">Quick tour</span>
          <span className="label-mono text-muted-foreground">
            {String(index + 1).padStart(2, "0")} / {String(active.length).padStart(2, "0")}
          </span>
        </div>
        <h2 className="mt-2 text-base font-semibold">{step.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={finish} className="label-mono text-muted-foreground hover:text-foreground">
            Skip tour
          </button>
          <div className="flex gap-2">
            {index > 0 ? (
              <Button size="sm" variant="ghost" onClick={() => setIndex(index - 1)}>
                Back
              </Button>
            ) : null}
            <Button size="sm" onClick={() => (last ? finish() : setIndex(index + 1))}>
              {last ? "Start building" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const WORKSPACE_TOUR: TourStep[] = [
  {
    target: "chat-input",
    title: "Describe what you want",
    body: "Type like you would in any AI builder. You can send another prompt while one is still running. They run side by side.",
  },
  {
    target: "chat",
    title: "See what it remembered",
    body: "Under each reply, the 🧠 line shows which memories shaped the answer. Expand it to see why, and edit or forget anything in the Memory tab.",
  },
  {
    target: "model-picker",
    title: "Use any model",
    body: "Claude, GPT, Gemini, Groq or open-source. Switch any time; each reply shows its tokens and cost.",
  },
  {
    target: "mode-switch",
    title: "Simple or Pro, same project",
    body: "Simple keeps it to chat and preview. Pro adds files, diffs, logs and the agent trace, without exporting anything.",
  },
  {
    target: "panels",
    title: "Your app lives here",
    body: "Preview the app as it's built, read the code, manage memory, and deploy.",
  },
  {
    target: "command-palette",
    title: "Search any feature with ⌘K",
    body: "Type what you want, like “cost”, “undo” or “deploy”, and Architect takes you straight there. Projects and commands too.",
  },
  {
    target: "ship",
    title: "Ship when ready",
    body: "Push to GitHub and deploy from here. Public sites can turn on SEO/GEO.",
  },
];
