"use client";

import { LayoutGridIcon, LogInIcon, LogOutIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  username,
  avatarUrl,
  isGuest = false,
}: {
  username: string;
  avatarUrl: string | null;
  isGuest?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-7">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutGridIcon />
            Projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isGuest ? (
          <DropdownMenuItem asChild>
            <Link href="/login">
              <LogInIcon />
              Sign in with GitHub or Google
            </Link>
          </DropdownMenuItem>
        ) : (
          // Signs out, then the login page asks GitHub/Google which account to use.
          <form action="/auth/signout" method="post">
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <UsersIcon />
                Switch account
              </button>
            </DropdownMenuItem>
          </form>
        )}
        {/* Sign-out is a POST so it can't be triggered by a prefetch or a stray link. */}
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOutIcon />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
