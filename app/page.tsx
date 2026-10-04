import { ArrowUpIcon, BrainIcon, CodeIcon, MessageSquareIcon } from "lucide-react";
import Link from "next/link";

import { signInAsGuest } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const FEATURES = [
  {
    icon: MessageSquareIcon,
    title: "Simple mode",
    body: "Chat on the left, live preview on the right. No code required.",
  },
  {
    icon: CodeIcon,
    title: "Pro mode",
    body: "File tree, diffs, logs and the full agent trace when you want control.",
  },
  {
    icon: BrainIcon,
    title: "Architect remembers",
    body: "Your decisions, preferences and past fixes carry across sessions — and you can see and edit every memory.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={signInAsGuest}>
            <Button type="submit" variant="ghost" size="sm">
              Try the demo
            </Button>
          </form>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="space-y-4 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Build AI agents by describing them.
          </h1>
          <p className="text-balance text-lg text-muted-foreground">
            Architect plans, writes and previews your agent — and remembers how you like to build.
          </p>
        </div>

        {/* GET → /dashboard?prompt=… ; proxy.ts sends signed-out users through /login first. */}
        <form action="/dashboard" className="w-full">
          <div className="rounded-xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/50">
            <Textarea
              name="prompt"
              required
              rows={4}
              maxLength={2000}
              placeholder="Describe the app or agent you want to build."
              className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs text-muted-foreground">
                e.g. “A support agent that answers from our Notion docs and escalates to Slack”
              </span>
              <Button type="submit" size="icon" aria-label="Start building">
                <ArrowUpIcon className="size-4" />
              </Button>
            </div>
          </div>
        </form>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="space-y-2 rounded-lg border p-4">
              <Icon className="size-5 text-primary" />
              <h2 className="font-medium">{title}</h2>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
