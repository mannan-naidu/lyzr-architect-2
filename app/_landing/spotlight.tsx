"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A section with a soft light that follows the pointer (desktop only; static on touch). */
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  const move = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - box.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - box.top}px`);
  };

  return (
    <section ref={ref} onPointerMove={move} className={cn("group/spot relative overflow-hidden", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100 motion-reduce:hidden"
        style={{
          background:
            "radial-gradient(520px circle at var(--spot-x, 50%) var(--spot-y, 30%), oklch(1 0 0 / 0.14), transparent 60%)",
        }}
      />
      {children}
    </section>
  );
}
