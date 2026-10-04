import { ArrowUpIcon } from "lucide-react";
import Link from "next/link";

import { signInAsGuest } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { SectionTag } from "@/components/section-tag";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TICKER = [
  "Remembered: prefers Tailwind + Supabase",
  "Fix reused from 12 Sep: CORS on /api/agent — free",
  "Loop broken after 2 attempts — rolled back, asked 1 question",
  "Remembered: dense dashboards, no localStorage tokens",
  "Self-fix tokens: not billed",
];

const PROBLEMS = [
  { tag: "Doom loops", title: "It repeats failed fixes", body: "Agents forget what they already tried, so the same bug burns credits again and again." },
  { tag: "Billing", title: "You pay for its mistakes", body: "Retries and self-inflicted errors are billed like real work. Costs spike without warning." },
  { tag: "Context", title: "Every project starts cold", body: "Your stack, style and past decisions vanish between sessions. You re-explain everything." },
  { tag: "Trust", title: "Memory is a black box", body: "When tools do remember, you can't see what, why, or delete it." },
];

const LOOP = [
  { n: "01", label: "Prompt", body: "Describe the app or agent. Architect pre-fills what it already knows about you." },
  { n: "02", label: "Plan", body: "Review a short plan and the agents it will build. Approve or tweak." },
  { n: "03", label: "Build", body: "Watch files and agents come together in a live preview." },
  { n: "04", label: "Fix", body: "Errors are fixed using remembered solutions — free, and never the same failed fix twice." },
  { n: "05", label: "Ship", body: "Push to GitHub and deploy. Optional SEO/GEO for public pages." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero (blue band) ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--blue)] text-[oklch(0.96_0.012_90)]">
        {/* Oversized faint glyph, like rig.ai's background mark. */}
        <span
          aria-hidden
          className="font-wide pointer-events-none absolute -right-10 -bottom-24 hidden text-[28rem] leading-none font-bold text-white/[0.06] select-none lg:block"
        >
          2.0
        </span>
        <div className="relative mx-auto max-w-6xl px-6">
          <header className="flex h-20 items-center justify-between">
            <Logo inverted />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm" className="text-inherit hover:bg-white/10 hover:text-inherit">
                <Link href="/login">Sign in</Link>
              </Button>
              <form action={signInAsGuest}>
                <Button type="submit" size="sm" className="bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink)]/90">
                  Try the demo
                </Button>
              </form>
            </div>
          </header>

          <div className="max-w-4xl pt-10 pb-14">
            <h1 className="text-5xl leading-[0.95] font-semibold sm:text-7xl">
              Build agents that remember you.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Describe it, watch it get built, ship it. Architect remembers your decisions and every
              fix — so you never pay for the same mistake twice.
            </p>

            {/* GET → /dashboard?prompt=… ; proxy.ts sends signed-out users through /login first. */}
            <form action="/dashboard" className="mt-10 max-w-2xl">
              <div className="chamfer-lg bg-[var(--ink)] p-2 text-[var(--paper)]">
                <Textarea
                  name="prompt"
                  required
                  rows={3}
                  maxLength={2000}
                  placeholder="Describe the app or agent you want to build."
                  className="resize-none border-0 bg-transparent text-base text-[var(--paper)] shadow-none placeholder:text-[var(--paper)]/45 focus-visible:ring-0 dark:bg-transparent"
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="label-mono text-[var(--paper)]/45">Enter ↵ to start · no setup</span>
                  <Button type="submit" size="icon" aria-label="Start building">
                    <ArrowUpIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Ticker */}
        <div className="border-t border-white/15 py-3">
          <div className="flex w-max animate-[ticker_40s_linear_infinite] gap-12 whitespace-nowrap motion-reduce:animate-none">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="label-mono text-white/80">
                {t} <span className="ml-12 opacity-50">•</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Framed body ──────────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 border-x">
        <section className="border-b px-6 py-16 text-center">
          <SectionTag>The problem</SectionTag>
          <h2 className="mt-6 text-4xl font-semibold sm:text-5xl">AI builders forget. You pay.</h2>
        </section>

        <section className="grid border-b sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p, i) => (
            <article key={p.tag} className="space-y-3 border-b p-6 sm:border-r lg:border-b-0 [&:nth-child(4n)]:border-r-0">
              <div className="flex items-center justify-between">
                <span className="label-mono text-primary">{p.tag}</span>
                <span className="label-mono text-muted-foreground/60">00{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </section>

        <section className="border-b px-6 py-16 text-center">
          <SectionTag>Introducing Architect 2.0</SectionTag>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold sm:text-5xl">
            The builder that learns how you build
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            The flow you already know from other vibe-coding tools — prompt, preview, ship — with a
            memory you can see, edit and delete. Simple mode for everyone, Pro mode for developers,
            on the same project.
          </p>
        </section>

        <section className="grid border-b md:grid-cols-5">
          {LOOP.map((s) => (
            <div key={s.n} className="space-y-2 border-b p-6 md:border-r md:border-b-0 md:last:border-r-0">
              <div className="h-0.5 w-full bg-border">
                <div className="h-full w-1/3 bg-primary" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="label-mono text-muted-foreground">{s.n}</span>
                <span className="label-mono">{s.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col items-center gap-5 px-6 py-16 text-center">
          <SectionTag>No account needed</SectionTag>
          <h2 className="text-3xl font-semibold sm:text-4xl">See it remember in two minutes</h2>
          <form action={signInAsGuest}>
            <Button type="submit" size="lg" className="px-6">
              Try the demo
            </Button>
          </form>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between border-x px-6 py-4">
          <span className="label-mono text-muted-foreground">Architect 2.0 · Lyzr TPM assignment</span>
          <span className="label-mono text-muted-foreground">Memory by Memori</span>
        </div>
      </footer>
    </div>
  );
}
