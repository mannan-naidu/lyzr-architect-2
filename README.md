# Architect 2.0 — Architect remembers

**Architect 2.0** is a vibe-coding platform for AI agents that works for both non-technical users
and developers. Describe the agent you want, and Architect plans it, writes the files and shows a
live preview. **Simple mode** is just chat plus preview. **Pro mode** adds the file tree, diffs,
logs and the agent's trace. What makes it different is that **Architect remembers**. Using
[Memori](https://github.com/MemoriLabs/Memori) on Postgres, the builder agent keeps each user's
project decisions, preferences and past fixes across sessions. Users can also give the agents they
build their own memory, and a Memory panel shows exactly what is stored so they can edit or delete
it. It's built for Lyzr's TPM assignment and extends architect.new.

→ **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) · **Decisions:** [docs/decisions.md](docs/decisions.md) · **Setup:** [docs/SETUP.md](docs/SETUP.md)

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
| Auth (GitHub via Supabase) | ✅ Real | Session cookies via `@supabase/ssr`, route guard in `proxy.ts` |
| Database | ✅ Real | Supabase Postgres, RLS owner-only on every table |
| LLM chat | ✅ Real | Vercel AI SDK; Anthropic / OpenAI / Google / OpenRouter |
| Memory (Memori) | ✅ Real | BYODB in the `memori` schema; Memory panel to view/edit/delete |
| Live preview | ✅ Real | Sandpack (in-browser bundler) |
| GitHub push | ✅ Real | Octokit, push generated project to a new repo |
| Code sandbox (E2B) | 🟡 Simulated | UI + logs shaped like E2B; no remote VM |
| Multi-framework agent runs | 🟡 Simulated | LangGraph / CrewAI / OpenAI Agents templates generate code; runs are simulated |
| Deploy logs | 🟡 Simulated | Streamed, realistic logs; Vercel API if time allows |

> Session 1 status: auth, DB schema and app shell are in place. Chat, preview, Memory panel,
> GitHub and deploy land in later sessions (see `CLAUDE.md` → Scope guard).

## Local setup

Prerequisites: Node 20.19+ (22 recommended), pnpm 10, a Supabase project (see
[docs/SETUP.md](docs/SETUP.md)).

```bash
pnpm install
cp .env.example .env.local        # fill in real values
pnpm dlx supabase link --project-ref <your-ref>
pnpm db:migrate                   # applies supabase/migrations
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
| `pnpm tsx scripts/memori-spike.ts` | Memori store-and-recall spike ([results](docs/memori-spike.md)) |

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind v4 · shadcn/ui · Supabase (Auth + Postgres)
· Memori · Vercel AI SDK · Sandpack · Octokit · Vercel · pnpm
