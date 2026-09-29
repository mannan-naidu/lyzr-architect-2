# Kickoff: Architect 2.0 (Lyzr TPM assignment) — Session 1 setup

> Paste this whole file as your first message in Claude Code, or commit it to the repo root and say:
> "Read KICKOFF.md and do Session 1."

## Context

I'm building **Architect 2.0** for Lyzr's Technical Product Manager hiring assignment
(brief: https://hiring.lyzrarchitect.space/). It's a vibe-coding platform for AI agents that serves
both non-technical users and developers. It extends architect.new.

Grading, in priority order:
1. Technical architecture (diagram + ARCHITECTURE.md)
2. Design & UX
3. Feature coverage (simulated flows OK)
4. Working functionality (bonus)

**My angle: "Architect remembers."** Persistent memory via **Memori** (Postgres-based, open source).
The builder agent remembers each user's project decisions, preferences and past fixes across sessions.
Users can toggle memory on for the agents they build. A Memory panel shows users what is stored, and lets them edit or delete it.

**Two modes, one project:**
- **Simple mode:** chat + live preview.
- **Pro mode:** file tree, diffs, logs and agent trace.

I work in ~4-hour morning blocks. Keep each step small, working and committed.

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

## Session 1 tasks (do in order, commit after each)

1. **CLAUDE.md.** Create it at the repo root. Include:
   - the project summary above, the stack table, and the folder structure
   - commands (dev, build, lint, typecheck, db migrate)
   - these conventions: server components by default; all secrets server-side only; zod for input validation; no `any`; small components in `components/`; feature code in `app/(app)/...`
   - a "Real vs simulated" list: real = auth, DB, LLM chat, Memori, preview, GitHub push; simulated = E2B sandbox, multi-framework agent runs, deploy logs
2. **Scaffold.**
   - Next.js app with TypeScript, Tailwind, ESLint and the App Router.
   - Initialize shadcn/ui and add: button, input, textarea, card, dialog, dropdown-menu, tabs, sheet, sonner, avatar, badge, scroll-area, separator, tooltip.
   - Dark mode by default, with a toggle.
3. **Env setup.**
   - `.env.example` listing every variable, with comments: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY`, `MEMORI_API_KEY`.
   - Make sure `.env*` (except `.env.example`) is in `.gitignore`.
   - A `lib/env.ts` that validates env vars with zod and fails clearly when one is missing.
4. **Supabase.**
   - `lib/supabase/{client,server,middleware}.ts` using `@supabase/ssr`.
   - Middleware that protects `/(app)` routes.
   - A first migration with these tables, all with RLS enabled and owner-only policies:
     - `profiles`: id = auth user id; username, avatar_url, preferred_mode (`simple` | `pro`), default_model
     - `projects`: id, owner_id, name, description, framework (`lyzr` | `langgraph` | `crewai` | `openai-agents` | `custom`), mode, github_repo, memory_enabled bool, created_at, updated_at
     - `messages`: id, project_id, role, content, model, tokens_in, tokens_out, created_at
     - `project_files`: id, project_id, path, content, updated_at
     - `deployments`: id, project_id, status, url, logs jsonb, created_at
5. **Auth flow.**
   - Pages: `/login` (GitHub button), `/auth/callback`, and sign out.
   - After login, redirect to `/dashboard`.
   - Create a `profiles` row on first login, via a DB trigger or the callback.
6. **App shell (UI only, real data where cheap).** Get layout and navigation right; don't polish yet.
   - `/`: a landing page with a hero prompt box: "Describe the app or agent you want to build."
   - `/dashboard`: a project list (real, from the DB), a "New project" dialog (name + framework + memory toggle), and an empty state.
   - `/p/[id]`: the project workspace. Left: chat panel. Right: tabs for Preview / Code / Memory / Deploy (placeholders). Top bar: a Simple ↔ Pro mode switch, a model picker, and GitHub and Deploy buttons (stubs).
7. **Memori spike** (timebox: 1 hour). Create `scripts/memori-spike.ts`. First read the Memori README and docs (https://github.com/GibsonAI/memori).
   - Try connecting Memori to our Supabase Postgres (`DATABASE_URL`), in a separate schema.
   - Register an LLM client and set attribution to `entity = <user id>` and `process = <project id>`.
   - Store one fact, e.g. "user prefers Tailwind", and recall it in a second call.
   - If our own Postgres doesn't work in the timebox, try Memori Cloud with `MEMORI_API_KEY`.
   - Write the result to `docs/memori-spike.md`: what worked, what didn't, the chosen approach and why.
8. **Docs skeleton.**
   - Create `ARCHITECTURE.md` with a heading for each required topic, each holding one placeholder line:
     - Sandbox choice
     - Agent harness
     - Model-agnostic switching
     - Frontend ↔ sandbox ↔ backend + live preview
     - Proxy design
     - GitHub integration
     - Deployment strategy
     - Scaling to thousands of concurrent users
     - Memory layer (Memori)
   - Create `docs/` with `decisions.md`, an ADR-style log. Add the first entries: Vercel over AWS for the prototype; Supabase; Memori.
9. **README.md.** Include:
   - a one-paragraph pitch
   - a "Real vs simulated" table
   - local setup steps
   - a link to ARCHITECTURE.md
10. **Checks.** Before the final commit, run `pnpm lint`, `pnpm typecheck` (add the script) and `pnpm build`, and fix anything that fails.

## Things I must do by hand (tell me when you reach them; don't block)

- Create a Supabase project and give you the URL and keys (via the cloud environment's variables, not chat).
- Create a GitHub OAuth App:
  - Callback URL: `https://<supabase-project>.supabase.co/auth/v1/callback`
  - Add the client ID and secret in Supabase → Auth → Providers → GitHub.
- Import this repo into Vercel and paste the same env vars there.
- Get the LLM API keys (at least one) and optionally a Memori Cloud key.

Put these as a checklist in `docs/SETUP.md` with exact click-paths.

## Rules

- Commit after each numbered task, with clear messages. Work on a branch and open a PR at the end of the session.
- Never commit secrets or print them in logs.
- If a network call is blocked by the sandbox, tell me which domain so I can allow it. Don't work around it.
- If something in this plan is wrong or risky, say so before building it.
- Don't build later-session features yet: Sandpack preview, GitHub push, deploy, Pro-mode file tree, agent harness.
- Finish with a short summary covering: what works, what's stubbed, what you need from me, and a suggested Session 2 plan.

## Session 2+ preview (don't build now)

1. Chat with streaming + model switcher + token cap.
2. Agent harness v1 (plan → generate files → preview in Sandpack), with Memori recall before each turn and save after.
3. Memory panel (list, edit, delete) + agent config screen (framework templates, memory toggle).
4. GitHub: import a repo and push to a new repo (Octokit).
5. Deploy flow (simulated logs; Vercel API if time allows).
6. Pro mode (file tree, diff, agent trace) + UX polish.
7. Finish ARCHITECTURE.md, the diagram, a Loom walkthrough, and the submission.
