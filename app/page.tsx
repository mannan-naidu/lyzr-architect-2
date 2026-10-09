import Link from "next/link";

import { HeroPrompt } from "@/app/_landing/hero-prompt";
import { LoopSteps, type LoopStep } from "@/app/_landing/loop-steps";
import { Pillars, type FrameworkCode } from "@/app/_landing/pillars";
import { Reveal } from "@/app/_landing/reveal";
import { RotatingWord } from "@/app/_landing/rotating-word";
import { Spotlight } from "@/app/_landing/spotlight";
import { signInAsGuest } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { SectionTag } from "@/components/section-tag";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { generateAgentCode } from "@/lib/agents/codegen";
import type { PlannedAgent } from "@/lib/build/schemas";
import { AGENT_FRAMEWORKS, FRAMEWORK_LABELS } from "@/lib/types/database";

const TICKER = [
  "SEO + GEO score 96/100 · llms.txt generated",
  "Recalled 3 memories from your last project",
  "Remembered: dark theme, minimal style",
  "Compiled 1 agent spec to LangGraph, CrewAI and Lyzr",
  "Fix reused: same cause, same place",
  "Pushed 14 files to GitHub in one commit",
  "Imported 3 posts from WordPress",
  "FAQ published · structured data updated",
];

const PROBLEMS = [
  { tag: "Invisible", title: "Built, but never found", body: "Most generated apps are blank JavaScript shells. Google and AI answer engines see nothing to rank or quote." },
  { tag: "Forgetful", title: "Every project starts cold", body: "Your stack, style and past decisions vanish between sessions. You re-explain everything." },
  { tag: "Locked in", title: "Screens, not agents", body: "App builders give you UI without real agents; agent platforms give you agents without the app." },
  { tag: "Loops", title: "It repeats failed fixes", body: "Agents forget what they tried, so the same bug burns credits again, and you pay for it." },
];

const LOOP: LoopStep[] = [
  { n: "01", label: "Prompt", body: "Describe the app. Architect pre-fills what it already knows about you." },
  { n: "02", label: "Plan", body: "Screens, agents and decisions, with one-click answers to its questions. Approve or tweak." },
  { n: "03", label: "Build", body: "Watch the UI stream in file by file, in a live preview." },
  { n: "04", label: "Fix", body: "Errors are diagnosed first; past fixes are reused only when the cause matches." },
  { n: "05", label: "Ship", body: "Security check, SEO + GEO report, deploy, and your code in your own GitHub repo. Then edit content without code." },
];

const CATEGORIES = [
  { name: "App builders", who: "Lovable, Replit, Bolt", gives: "An app, but no real agents" },
  { name: "Agent platforms", who: "Lyzr Studio, n8n", gives: "Agents, but no app" },
  { name: "Coding tools", who: "Cursor, Claude Code", gives: "Control, if you're a developer" },
];

/** The sample agent the landing page compiles live, to show "run any agent" with real output. */
const SAMPLE_AGENT: PlannedAgent = {
  name: "Class Assistant",
  role: "Answers questions about classes, prices and timings",
  instructions: "Answer from the studio's schedule and FAQs. Be brief and friendly.",
  tools: ["search schedule"],
  memory: true,
  handsOffTo: [],
};

function sampleCode(): FrameworkCode[] {
  return AGENT_FRAMEWORKS.map((fw) => {
    const on = generateAgentCode(fw, [SAMPLE_AGENT], "Yoga Flow");
    const off = generateAgentCode(fw, [{ ...SAMPLE_AGENT, memory: false }], "Yoga Flow");
    return {
      id: fw,
      label: fw === "custom" ? "TypeScript" : FRAMEWORK_LABELS[fw].replace(" SDK", ""),
      filename: on.filename,
      withMemory: on.code.trimEnd(),
      withoutMemory: off.code.trimEnd(),
    };
  });
}

export default function Home() {
  const frameworks = sampleCode();

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero (blue band) ─────────────────────────────────────────────────── */}
      <Spotlight className="bg-[var(--blue)] text-[oklch(0.96_0.012_90)]">
        {/* Blueprint grid, fading out toward the bottom. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(1 0 0 / 0.09) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.09) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Oversized faint glyph, like rig.ai's background mark. */}
        <span
          aria-hidden
          className="font-wide pointer-events-none absolute -right-10 -bottom-24 hidden animate-[float_9s_ease-in-out_infinite] text-[28rem] leading-none font-bold text-white/[0.07] select-none motion-reduce:animate-none lg:block"
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
            <h1 className="animate-[fade-up_0.8s_cubic-bezier(0.2,0.7,0.2,1)_both] text-5xl leading-[0.95] font-semibold sm:text-7xl">
              From prompt to production.
            </h1>
            <p className="mt-5 animate-[fade-up_0.8s_cubic-bezier(0.2,0.7,0.2,1)_both] text-2xl font-medium [animation-delay:150ms] sm:text-4xl">
              AI apps that{" "}
              <span className="bg-[var(--ink)] px-2 text-[var(--paper)]">
                <RotatingWord words={["get found.", "remember.", "run any agent."]} />
              </span>
            </p>
            <p className="mt-6 max-w-2xl animate-[fade-up_0.8s_cubic-bezier(0.2,0.7,0.2,1)_both] text-lg text-white/80 [animation-delay:300ms]">
              Describe it and Architect plans, builds and ships it: SEO + GEO built in, a content
              editor anyone can use, a memory that learns how you build, and agents in Lyzr,
              LangGraph, CrewAI or OpenAI Agents.
            </p>

            {/* GET → /dashboard?prompt=… ; proxy.ts sends signed-out users through /login first. */}
            <div className="animate-[fade-up_0.8s_cubic-bezier(0.2,0.7,0.2,1)_both] [animation-delay:450ms]">
              <HeroPrompt />
            </div>
          </div>
        </div>

        {/* Ticker: hover to pause. */}
        <div className="relative border-t border-white/20 py-3">
          <div className="flex w-max animate-[ticker_40s_linear_infinite] gap-12 whitespace-nowrap hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="label-mono text-white/85">
                {t} <span className="ml-12 opacity-50">•</span>
              </span>
            ))}
          </div>
        </div>
      </Spotlight>

      {/* ── Framed body ──────────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 border-x">
        <section className="border-b px-6 py-16 text-center">
          <Reveal>
            <SectionTag>The problem</SectionTag>
            <h2 className="mt-6 text-4xl font-semibold sm:text-5xl">Most AI apps stop at &ldquo;it runs&rdquo;.</h2>
          </Reveal>
        </section>

        <section className="grid border-b sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.tag} delay={i * 90} className="border-b sm:border-r lg:border-b-0 [&:nth-child(4n)]:border-r-0">
              <article className="group h-full space-y-3 p-6 transition-colors hover:bg-card">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-primary">{p.tag}</span>
                  <span className="label-mono text-muted-foreground/60 transition-colors group-hover:text-primary">00{i + 1}</span>
                </div>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </section>

        <section className="border-b px-6 py-16 text-center">
          <Reveal>
            <SectionTag>Introducing Architect 2.0</SectionTag>
            <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold sm:text-5xl">Get found. Remember. Run any agent.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
              The flow you already know from other vibe-coding tools, with a quick tour on day one. Simple
              mode for everyone, Pro mode for developers, on the same project. Click through it below.
            </p>
          </Reveal>
        </section>

        <section className="border-b">
          <Reveal>
            <Pillars frameworks={frameworks} />
          </Reveal>
        </section>

        <section className="border-b px-6 py-12 text-center">
          <Reveal>
            <SectionTag>How it works</SectionTag>
          </Reveal>
        </section>

        <section className="border-b">
          <Reveal>
            <LoopSteps steps={LOOP} />
          </Reveal>
        </section>

        <section className="border-b px-6 py-16">
          <Reveal className="text-center">
            <SectionTag>Where it sits</SectionTag>
            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold sm:text-4xl">At the intersection of three crowded markets</h2>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-4xl gap-px border bg-border sm:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.name} delay={i * 100} className="h-full">
                <div className="h-full space-y-1 bg-background p-5 transition-colors hover:bg-card">
                  <span className="label-mono text-muted-foreground">{c.who}</span>
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.gives}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300} className="mx-auto max-w-4xl">
            <div className="border border-t-0 border-primary/60 bg-primary/10 p-5 text-center">
              <span className="label-mono text-primary">Architect 2.0</span>
              <p className="mt-1 text-lg font-semibold">The app, real agents, and the code underneath, in one project.</p>
            </div>
          </Reveal>
        </section>

        <section className="flex flex-col items-center gap-5 px-6 py-16 text-center">
          <Reveal className="flex flex-col items-center gap-5">
            <SectionTag>No account needed</SectionTag>
            <h2 className="text-3xl font-semibold sm:text-4xl">See it build, remember and ship in two minutes</h2>
            <form action={signInAsGuest}>
              <Button type="submit" size="lg" className="chamfer px-6 transition-transform hover:-translate-y-0.5">
                Try the demo
              </Button>
            </form>
          </Reveal>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between border-x px-6 py-4">
          <span className="label-mono text-muted-foreground">Architect 2.0 · Lyzr TPM assignment</span>
          <span className="label-mono text-muted-foreground">Memory by Lyzr Cognis</span>
        </div>
      </footer>
    </div>
  );
}
