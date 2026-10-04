# CLAUDE.md — Architect 2.0

## Project summary

**Architect 2.0** is a vibe-coding platform for AI agents, built for Lyzr's Technical Product Manager
assignment (brief: https://hiring.lyzrarchitect.space/). It extends architect.new and serves both
non-technical users and developers.

**Angle: "Architect remembers."** Persistent memory via **Memori** (Postgres-based, open source). The
builder agent remembers each user's project decisions, preferences and past fixes across sessions.
Users can toggle memory on for the agents they build. A Memory panel shows what is stored and lets
users edit or delete it.

**Two modes, one project:**
- **Simple mode:** chat + live preview.
- **Pro mode:** file tree, diffs, logs and agent trace.

Grading priority: (1) technical architecture (diagram + `ARCHITECTURE.md`), (2) design & UX,
(3) feature coverage (simulated flows OK), (4) working functionality (bonus).

The original kickoff brief lives in `docs/KICKOFF.md`. **Scope, feature list and session plan: `docs/PLAN.md`** (read it before starting a session).

## Stack (fixed — don't substitute without asking)

| Piece | Choice |
| --- | --- |
| App | Next.js (App Router) + TypeScript (strict) + Tailwind + shadcn/ui |
| Hosting | Vercel (auto-deploys from `main`; branches get preview URLs) |
| Auth | Supabase Auth with GitHub OAuth (`repo` scope so we can push later) |
| Database | Supabase Postgres, with migrations in `supabase/migrations/` |
| Memory | Memori (`@memorilabs/memori`) on the same Postgres, in its own schema; Memori Cloud as fallback |
| LLM | Vercel AI SDK with a provider switcher (Anthropic, OpenAI, Google, OpenRouter) |
| Live preview | Sandpack (later session) |
| GitHub | Octokit (later session) |
| Package manager | pnpm |

## Folder structure

```
app/
  page.tsx                 # landing page (hero prompt box)
  login/                   # GitHub sign-in
  auth/callback/           # OAuth code exchange
  auth/signout/            # POST → sign out
  (app)/                   # authenticated feature code (route group, not a URL segment)
    layout.tsx             # app chrome (top nav, user menu)
    dashboard/             # project list + "New project" dialog
    p/[id]/                # project workspace (chat + Preview/Code/Memory/Deploy tabs)
components/
  ui/                      # shadcn/ui primitives (generated — edit sparingly)
  *.tsx                    # small shared components (theme toggle, logo, ...)
lib/
  env.ts                   # zod-validated public env (NEXT_PUBLIC_*)
  env.server.ts            # zod-validated server env (secrets; server-only)
  supabase/{client,server,middleware}.ts
  types/database.ts        # hand-written DB row types (regen later with supabase gen types)
  utils.ts                 # cn() helper
proxy.ts                   # Next 16 "middleware" — refreshes session, guards app routes
supabase/migrations/       # SQL migrations (source of truth for schema + RLS)
scripts/                   # one-off scripts (e.g. memori-spike.ts)
docs/                      # PLAN.md (scope + sessions), decisions.md (ADRs), SETUP.md, memori-spike.md, KICKOFF.md
ARCHITECTURE.md            # the graded architecture write-up
```

## Commands

| Task | Command |
| --- | --- |
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| DB migrate (linked Supabase project) | `pnpm db:migrate` (runs `supabase db push`) |
| New migration | `pnpm dlx supabase migration new <name>` |
| Memori spike | `pnpm tsx scripts/memori-spike.ts` |

## Conventions

- **Server components by default.** Add `"use client"` only for interactivity, at the leaf.
- **All secrets server-side only.** Only `NEXT_PUBLIC_*` vars may reach the browser. Server-only
  modules import `server-only`. Never log secrets.
- **zod for all input validation** — env vars, server actions, route handlers, form payloads.
- **No `any`.** TypeScript is strict; use `unknown` + narrowing.
- **Small components in `components/`**; **feature code in `app/(app)/...`** (co-locate
  feature-specific components and server actions next to the route).
- DB access goes through the Supabase client with the user's session so **RLS is the security
  boundary**. The service-role key is for trusted server jobs only.
- Every table has RLS enabled with owner-only policies. Schema changes = a new migration file.
- Dark mode is the default; theme via `next-themes`.
- Commit small, working steps. Run `pnpm lint && pnpm typecheck && pnpm build` before pushing.

## Real vs simulated

| Real | Simulated |
| --- | --- |
| Auth (Supabase + GitHub OAuth) | E2B sandbox |
| Database (Supabase Postgres + RLS) | Multi-framework agent runs (LangGraph, CrewAI, OpenAI Agents) |
| LLM chat (Vercel AI SDK, multi-provider) | Deploy logs |
| Memori memory | |
| Live preview (Sandpack) | |
| GitHub push (Octokit) | |

## Scope guard

Don't build later-session features until their session: Sandpack preview, GitHub push, deploy,
Pro-mode file tree, agent harness. Stubs/placeholders are fine.

@AGENTS.md
