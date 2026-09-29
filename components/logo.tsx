import { SparklesIcon } from "lucide-react";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <SparklesIcon className="size-4" />
      </span>
      <span>
        Architect <span className="text-muted-foreground">2.0</span>
      </span>
    </Link>
  );
}
