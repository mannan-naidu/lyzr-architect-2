"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type LoopStep = { n: string; label: string; body: string };
const STEP_MS = 2600;

/** Prompt → Plan → Build → Fix → Ship: the active step advances on its own; hover or tap to hold one. */
export function LoopSteps({ steps }: { steps: LoopStep[] }) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [active, held, steps.length]);

  return (
    <div className="grid md:grid-cols-5" onMouseLeave={() => setHeld(false)}>
      {steps.map((s, i) => {
        const on = i === active;
        const done = i < active;
        return (
          <button
            key={s.n}
            type="button"
            onMouseEnter={() => {
              setHeld(true);
              setActive(i);
            }}
            onClick={() => {
              setHeld(true);
              setActive(i);
            }}
            className={cn(
              "space-y-2 border-b p-6 text-left transition-colors md:border-r md:border-b-0 md:last:border-r-0",
              on && "bg-card",
            )}
          >
            <div className="h-0.5 w-full bg-border">
              <div
                key={on ? `on-${active}-${held}` : "off"}
                className={cn(
                  "h-full w-full origin-left bg-primary",
                  on && !held && "animate-[grow-x_linear_both] motion-reduce:animate-none",
                  !on && (done ? "opacity-40" : "scale-x-0"),
                )}
                style={on && !held ? { animationDuration: `${STEP_MS}ms` } : undefined}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className={cn("label-mono", on ? "text-primary" : "text-muted-foreground")}>{s.n}</span>
              <span className={cn("label-mono transition-colors", on ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
            </div>
            <p className={cn("text-sm transition-colors", on ? "text-foreground" : "text-muted-foreground")}>{s.body}</p>
          </button>
        );
      })}
    </div>
  );
}
