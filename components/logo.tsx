import Link from "next/link";

import { cn } from "@/lib/utils";

/** Wordmark: wide lowercase "architect" with a mono version tag. */
export function Logo({ href = "/", inverted = false }: { href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className="flex items-baseline gap-2" aria-label="Architect 2.0 home">
      <span className={cn("font-wide text-xl font-bold tracking-tight", inverted ? "text-[var(--ink)]" : "text-foreground")}>
        architect
      </span>
      <span className={cn("label-mono", inverted ? "text-[var(--ink)]/70" : "text-primary")}>2.0</span>
    </Link>
  );
}
