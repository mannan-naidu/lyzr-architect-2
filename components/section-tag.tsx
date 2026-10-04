import { XIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Small boxed mono label used to open a section ("THE PROBLEM", "INTRODUCING …"). */
export function SectionTag({ children }: { children: ReactNode }) {
  return (
    <span className="label-mono inline-flex items-center gap-2 border bg-card px-3 py-1.5 text-primary">
      <XIcon className="size-3" aria-hidden />
      {children}
    </span>
  );
}
