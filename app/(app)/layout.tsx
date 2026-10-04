import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { CommandPalette } from "@/components/command-palette";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/user-menu";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // proxy.ts already guards these routes; this is defence in depth.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("projects").select("id, name").order("updated_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" />
          {user.isAnonymous ? (
            <Badge variant="secondary" title="Guest session: data is kept but tied to this browser">
              Demo mode
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <CommandPalette projects={projects ?? []} />
          <ThemeToggle />
          <UserMenu
            username={profile?.username ?? user.email ?? (user.isAnonymous ? "Guest" : "You")}
            avatarUrl={profile?.avatar_url ?? null}
          />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
