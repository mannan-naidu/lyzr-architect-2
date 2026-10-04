# Rival submissions: feature inventory

Public repos for the same Lyzr "Architect 2.0" assignment, read from their READMEs on 2026-10-04.
Used to decide what we present first (unique) vs last (shared). See PLAN.md §8.

## Per repo

| Repo (live URL) | Positioning | Notable features | Real vs simulated |
| --- | --- | --- | --- |
| **Apurv428** (lyzr-architect-2-0-orcin.vercel.app) | Guided ⇄ Pro; "skill is a dial" | Plan approval, Monaco diffs, LLM/tool/RAG/guardrail config, **evals**, "Autopilot" self-improvement, agent API, **MCP server**, webhooks, checkpoints, env vars, preview/prod, rollback, PRs, team workspaces, prompt caching, metrics plan | Largely real (Claude + OpenAI, Sandpack + WebContainer, Supabase); 25+ tool integrations simulated |
| **Tirush04** (architect-2-tirush.vercel.app) | "One project, two lenses" | Blueprint + wireframes, streamed codegen, checkpoints, **click-to-edit preview**, agent canvas, 6-framework codegen, GitHub create/push/import, real public deploys (CSP sandbox), command palette | Real with Claude key; scripted demo engine otherwise |
| **aryansaharan**, "Prod AI" (prod-ai-studio.vercel.app) | "Agentic apps you'd trust in production"; **pencil-to-ink sheet** instead of chat | Margin notes with **priced changes**, approval gates, plan map (Plain/Settings/Code), PR per change, repo import with "House Rules", publish + rollback, 6 frameworks (Lyzr ADK, LangGraph, CrewAI, OpenAI, Google ADK, Mastra), **free fixes**, cost model ($9.30 per builder per month) | Auth, planning, renderer, GitHub, publish real; build timeline and tests simulated; Playwright E2E |
| **shambhu-10** (architect-2-lyart.vercel.app) | One project, two views | Google/GitHub/magic-link auth, version history, agent playground, GitHub PRs, **Google Calendar OAuth**, Monaco with ⌘K, **voice input (Whisper)**, AGENTS.md sync, public URLs with view counts, AES secrets vault, **3 AI theme options**, in-place text edit, team RBAC, **security pre-flight**, **free fixes capped at 3**, comments on preview, "pause AI & edit by hand", focus mode | Many real; build, traces, evals and metering simulated |
| **sandalagrawal** (lyzr-architect-snowy.vercel.app) | **Three depths**: Outcome / Blueprint / Code (⌘1/2/3) | Click-to-edit, theme import, checkpoints, IDE with diffs and branches, artifacts, agent studio, test and trace, evals, 6 frameworks incl. GitAgent and Mastra, agent library, egress allowlist, **security scan** (secrets, RLS, PII, prompt injection), env vault, deploy pre-flight, marketplace | Auth, DB, IDE real; codegen, sandbox, deploy simulated |
| **asankhua** (lyzr-ai-project.onrender.com) | Rebuilds architect.new's feature set | AI Consultant, prompt library, templates, plan, agent graph, codegen, preview, **self-healing**, env vars, versions, GitHub connect/push/import, deploy to a public URL, guest `/try`, usage/credits | Many real (Groq, Vercel token); Studio/marketplace/MCP dummy |
| **ritikadas98** (ritikadas.in/architect) | "Asks before it assumes" | Confirms what it read from screenshots, multiple-choice design questions, **design.md**, **pre-launch security scan**, add-on suggestions, GitHub App/CLI/MCP, **free fixes for agent-caused bugs** | Auth + RLS + scanners real; AI scripted |
| **Aditya2github** (architect-2-mauve.vercel.app) | Ops lead + staff engineer | "Start from your data" (CSV), **cost-transparent build contracts**, agent report cards with eval scores, preview/staging/prod, build timeline, command palette, guided tour, demo mode | Auth, DB, plan (Claude) real; evals, deploy, GitHub, MCP, CLI simulated |
| **HeyImAnuj** (architect-2-kohl.vercel.app) | Dual lane (Soft/Pro) | **Flow canvas first**, agent graph, 6 frameworks, file editor, GitHub push, public `/a/` links, studio credits | Preview, GitHub, Postgres real; connectors stored only |
| **shriyashish-mishra** (architect-20-ten.vercel.app) | Vibe / Pro, "two doors" | Supabase auth incl. guest, RLS, GitHub import, blueprint aesthetic | Auth, DB, import real; trace, preview, deploy simulated |
| **MeShreyash** (static) | Builder / Developer | **Sequential prompt queue**, **clarification gate**, problems panel, apply/revert, agent studio, git conflicts, promote/rollback | Fully simulated |
| **adminthelinkai** (static) | Business/dev shared workflows | Domain blueprints, impact tracking + undo, release gates, snapshots, JSON export, a11y checks | Local-only, simulated |
| **akhilmankala26** (architect20.vercel.app) | Design-first | Theme manager, **LLM recommendation with cost-benefit**, streamed collapsible reasoning, prompt-quality check | No backend; mostly scripted |
| **NirmalyaRakshit** (lyzr-architect-2-0.vercel.app) | Progressive disclosure | Chat, preview, code editor, terminal, git tabs | Unclear |
| shivamATpaytm | n/a | (repo private or removed: 404) | n/a |

## How common each feature is (out of 14 readable repos)

| Feature | Count | Who |
| --- | --- | --- |
| Two modes/lenses on one project | 14 | everyone |
| Plan before build | ~10 | most |
| GitHub push/import/PR | ~10 | most |
| Supabase auth + RLS | ~8 | most; **Google sign-in** in 5 |
| Multi-framework codegen (5–6 frameworks) | 5 | Tirush, aryansaharan, sandalagrawal, HeyImAnuj, Apurv |
| Checkpoints / rollback | 7 | many |
| Click-to-edit preview | 4 | Tirush, sandalagrawal, shambhu, ritikadas |
| Security pre-flight scan | 3 | ritikadas, sandalagrawal, shambhu |
| Free fixes for agent errors | 3 | ritikadas, aryansaharan, shambhu (cap of 3) |
| Cost transparency / priced changes | 3 | aryansaharan, Aditya2github, shambhu |
| Evals / agent report cards | 4 | Apurv, Aditya2github, sandalagrawal, shambhu |
| MCP / CLI / agent API | 4 | Apurv, ritikadas, Aditya2github, sandalagrawal |
| **Cross-project memory / fix memory / visible memory** | **0** | none |
| **SEO/GEO optimization** | **0** | none |
| **CMS for non-technical content editing** | **0** | none |
| Voice input, calendar OAuth, focus mode | 1 | shambhu |

## What this means for us

- **Unique (lead with):**
  - Fix memory and the loop breaker *driven by remembered failures* (others do "free fixes" with no
    memory).
  - Builder memory across projects, visible memory (recall dropdown, "Why?", Memory panel), agent
    memory toggle (Cognis-compatible), the SEO/GEO toggle, and the CMS.
- **Partly shared, so differentiate on depth:**
  - Free fixes and cost transparency: ours is a *ledger* driven by memory.
  - Security scan: ours is tied to remembered security decisions.
- **Shared baseline (present last):** two lenses, plan-before-build, GitHub, frameworks,
  checkpoints, click-to-edit, Google sign-in.
- **Ideas worth borrowing (small):** a guest/demo mode so reviewers don't need GitHub, a command
  palette, and a sequential prompt queue.
