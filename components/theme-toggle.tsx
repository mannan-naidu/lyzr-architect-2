"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "light" ? "dark" : "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      // A fixed label: the resolved theme isn't known on the server, so a dynamic one would mismatch.
      aria-label="Toggle light and dark mode"
      onClick={() => setTheme(next)}
    >
      {/* Both icons render; CSS picks one so there's no hydration mismatch. */}
      <SunIcon className="hidden size-4 dark:block" />
      <MoonIcon className="size-4 dark:hidden" />
    </Button>
  );
}
