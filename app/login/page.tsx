import { GitHubIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { safeNextPath } from "@/lib/auth";

import { signInWithGitHub } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <Logo />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your GitHub account. We&apos;ll ask for repo access so Architect can push your
            projects later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInWithGitHub}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" className="w-full">
              <GitHubIcon className="size-4" />
              Continue with GitHub
            </Button>
          </form>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              Sign-in failed: {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          By continuing you agree that Architect stores your projects and memories in your account.
        </CardFooter>
      </Card>
    </main>
  );
}
