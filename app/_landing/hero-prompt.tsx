"use client";

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLES = [
  { chip: "Yoga studio site", prompt: "A website for my yoga studio with class schedules, pricing, FAQs and an assistant that answers questions about classes." },
  { chip: "Support triage agent", prompt: "A support inbox that answers customer questions from our docs and escalates angry customers to Slack." },
  { chip: "Lead qualifier", prompt: "A landing page that captures leads and an agent that scores them and drafts a follow-up email." },
  { chip: "Portfolio, no AI", prompt: "A one-page portfolio for a product designer with case studies and a contact form." },
];

/**
 * The hero prompt box: an animated placeholder that types example ideas, one-click example
 * chips, and Enter to submit (Shift+Enter for a new line). Submits GET /dashboard?prompt=….
 */
export function HeroPrompt() {
  const [value, setValue] = useState("");
  const [typed, setTyped] = useState("");
  const [focused, setFocused] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Typewriter placeholder: types an example, holds, deletes, moves to the next.
  useEffect(() => {
    if (value || focused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let example = 0;
    let chars = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const text = EXAMPLES[example]!.prompt;
      if (!deleting) {
        chars += 1;
        setTyped(text.slice(0, chars));
        if (chars >= text.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1800);
          return;
        }
        timer = window.setTimeout(tick, 28);
      } else {
        chars = Math.max(0, chars - 4);
        setTyped(text.slice(0, chars));
        if (chars === 0) {
          deleting = false;
          example = (example + 1) % EXAMPLES.length;
        }
        timer = window.setTimeout(tick, 18);
      }
    };
    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, [value, focused]);

  return (
    <form ref={formRef} action="/dashboard" className="mt-10 max-w-2xl">
      <div className="chamfer-lg bg-[var(--ink)] p-2 text-[var(--paper)] shadow-[0_20px_60px_-20px_oklch(0.2_0.05_250/0.6)] transition-transform duration-300 focus-within:-translate-y-0.5">
        <div className="relative">
          <Textarea
            name="prompt"
            required
            rows={3}
            maxLength={2000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && value.trim()) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            aria-label="Describe the app or agent you want to build"
            placeholder={focused ? "Describe the app or agent you want to build." : ""}
            className="relative z-10 resize-none border-0 bg-transparent text-base text-[var(--paper)] shadow-none placeholder:text-[var(--paper)]/45 focus-visible:ring-0 dark:bg-transparent"
          />
          {!value && !focused ? (
            <p aria-hidden className="pointer-events-none absolute inset-0 px-3 py-2 text-base text-[var(--paper)]/50">
              {typed}
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-[caret_1s_steps(1)_infinite] bg-[var(--paper)]/70" />
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          <span className="label-mono text-[var(--paper)]/45">Enter ↵ to start · no setup</span>
          <Button type="submit" size="icon" aria-label="Start building" disabled={!value.trim()}>
            <ArrowUpIcon className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="label-mono self-center text-white/60">Try</span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.chip}
            type="button"
            onClick={() => setValue(ex.prompt)}
            className="label-mono animate-[fade-up_0.6s_ease_both] border border-white/30 px-2.5 py-1.5 text-white/85 transition-colors hover:border-white hover:bg-white/10 hover:text-white"
            style={{ animationDelay: `${600 + i * 90}ms` }}
          >
            {ex.chip}
          </button>
        ))}
      </div>
    </form>
  );
}
