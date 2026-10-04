import { BrainIcon, ReceiptIcon, RotateCcwIcon } from "lucide-react";

import { GitHubIcon, GoogleIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { SectionTag } from "@/components/section-tag";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/auth";

import { signInAsGuest, signInWithProvider } from "./actions";

const POINTS = [
  { icon: BrainIcon, text: "Remembers your stack, style and decisions across projects" },
  { icon: RotateCcwIcon, text: "Never retries a fix that already failed" },
  { icon: ReceiptIcon, text: "Its own mistakes aren't billed to you" },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      {/* Left: brand panel (blue band, like the landing hero). */}
      <section className="hidden flex-col justify-between bg-[var(--blue)] p-10 text-[oklch(0.96_0.012_90)] lg:flex">
        <Logo inverted />
        <div className="space-y-8">
          <h1 className="text-5xl leading-[0.95] font-semibold">Pick up where you left off.</h1>
          <ul className="space-y-3">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85">
                <Icon className="size-4 shrink-0" /> {text}
              </li>
            ))}
          </ul>
        </div>
        <span className="label-mono text-white/60">Architect 2.0</span>
      </section>

      {/* Right: the form. */}
      <section className="flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="space-y-3">
            <SectionTag>Sign in</SectionTag>
            <h2 className="text-3xl font-semibold">Welcome to Architect</h2>
            <p className="text-sm text-muted-foreground">
              Use Google or GitHub. You can connect GitHub later to push your projects.
            </p>
          </div>

          <form action={signInWithProvider} className="flex flex-col gap-2">
            <input type="hidden" name="next" value={next} />
            <Button type="submit" name="provider" value="google" variant="outline" size="lg" className="w-full">
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>
            <Button type="submit" name="provider" value="github" size="lg" className="w-full">
              <GitHubIcon className="size-4" />
              Continue with GitHub
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="label-mono text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form action={signInAsGuest}>
            <Button type="submit" variant="ghost" size="lg" className="w-full">
              Try the demo, no account needed
            </Button>
          </form>

          {error ? (
            <p role="alert" className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Sign-in failed: {error}
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            By continuing you agree that Architect stores your projects and memories in your account.
            You can view and delete any memory at any time.
          </p>
        </div>
      </section>
    </main>
  );
}
