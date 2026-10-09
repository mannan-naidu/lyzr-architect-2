"use client";

import { useEffect, useState } from "react";

/** Cycles through the three promises of the hook: get found, remember, run any agent. */
export function RotatingWord({ words, interval = 2200 }: { words: readonly string[]; interval?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      {/* Invisible longest word keeps the width stable while words swap. */}
      <span aria-hidden className="invisible">
        {words.reduce((a, b) => (b.length > a.length ? b : a), "")}
      </span>
      <span key={i} className="absolute inset-0 animate-[word-in_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both]" aria-live="polite">
        {words[i]}
      </span>
    </span>
  );
}
