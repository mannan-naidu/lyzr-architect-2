# Architect 2.0

> **From prompt to production: AI apps that get found, remember, and run any agent.**

**Architect 2.0** is a vibe-coding platform for agentic apps, for non-technical users and developers.
Describe an app; Architect plans it, writes the files, shows a live preview and ships it, with
SEO + GEO built in and agents in the framework you choose. **Simple mode** is just chat plus preview. **Pro mode** adds the file tree, diffs,
logs and the agent's trace. What makes it different is that **Architect remembers**. Using
[Lyzr Cognis](https://docs.lyzr.ai/cognis/overview) (open source, running as a Docker service on AWS), the builder agent keeps each user's
project decisions, preferences and past fixes across sessions. Users can also give the agents they
build their own memory, and a Memory panel shows exactly what is stored so they can edit or delete
it. It's built for Lyzr's TPM assignment and extends architect.new.

![Architecture](docs/architecture/architecture.png)

→ **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) · **Submission:** [SUBMISSION.md](SUBMISSION.md) · **Decisions:** [docs/decisions.md](docs/decisions.md) · **Setup:** [docs/SETUP.md](docs/SETUP.md)

## Design principles

- **Familiar first.** The flow is the one people already know from vibe-coding tools: a prompt box
  on the home page, then chat on the left and preview on the right, then GitHub and Deploy at top
  right. Nothing needs re-learning. What's new (memory, cost and fix tracking) appears *inside*
  that familiar flow as small, expandable details, not as new screens to learn.
- **A quick tour at the start.** First-time users get a 7-step spotlight tour of the workspace
  (prompt box, memory dropdown, model picker, Simple/Pro, panels, ⌘K, Ship). It is skippable,
  shown once, and can be replayed from the ⌘K palette.
- **Visual language.** "Ink & paper" (inspired by rig.ai): a near-black teal background with cream
  type and a blue accent, wide display headings, mono labels, hairline grids and chamfered
  buttons. A light ("paper") theme is included.
- **Show, don't hide.** Every reply shows what was remembered and what it cost. Memory is
  collapsed by default so the chat stays clean.

## Real vs simulated

| Area | Status | Notes |
| --- | --- | --- |
| Auth | ✅ Real | Supabase: GitHub, Google, anonymous demo mode; `proxy.ts` refreshes the session |
| Database | ✅ Real | Supabase Postgres, RLS owner-only on every table |
| Chat | ✅ Real | Vercel AI SDK, 5 providers (Anthropic, OpenAI, Google, Groq, OpenRouter), parallel prompts |
| Plan → build | ✅ Real | Typed plan (structured output), approve, streamed file generation |
| Live preview | ✅ Real | Sandpack (in-browser bundler) with error capture |
| Fix memory + loop breaker | ✅ Real | Error signatures across projects, 3-try limit, rollback, self-fixes billed to the agent |
| Builder memory | ✅ Real | Lyzr Cognis (open source) in `memory-service/`: Docker on AWS EC2, hybrid vector + BM25 recall; Memory tab lists, edits (re-embeds), deletes and forgets |
| Decision log, ledger, trace, diffs | ✅ Real | `decisions`, `messages`, `run_events`, `project_files.previous_content` |
| Agents | ✅ Real (code) / 🟡 Simulated (runs) | Code generated for Lyzr, LangGraph, CrewAI, OpenAI Agents SDK, TS; preview runs via `/agents.ts` simulator |
| GitHub push | ✅ Real | Octokit, one commit per push; token AES-256-GCM encrypted |
| Security check, SEO/GEO | ✅ Real | Deterministic checks; generated meta, sitemap, robots, JSON-LD, `llms.txt` |
| CMS + WordPress import | ✅ Real | `cms_entries`; public WordPress REST API |
| Hosting user apps | 🟡 Simulated | Logs, URL and history are recorded; Vercel API is the production design |
| E2B sandboxes | 🟡 Simulated | Designed in ARCHITECTURE.md §6; Sandpack runs the UI today |

Submission answers and the deploy checklist: [SUBMISSION.md](SUBMISSION.md).

## Local setup

Prerequisites: Node 20.19+ (22 recommended), pnpm 10, a Supabase project (see
[docs/SETUP.md](docs/SETUP.md)).

```bash
pnpm install
cp .env.example .env.local        # fill in real values
pnpm dlx supabase link --project-ref <your-ref>
pnpm db:migrate                   # or paste supabase/setup.sql into the SQL Editor
pnpm dev                          # http://localhost:3000
```

Useful scripts:

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Route type generation + `tsc --noEmit` |
| `pnpm db:migrate` | `supabase db push` to the linked project |

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind v4 · shadcn/ui · Supabase (Auth + Postgres)
· Lyzr Cognis (Docker on AWS) · Vercel AI SDK · Sandpack · Octokit · Vercel · pnpm
