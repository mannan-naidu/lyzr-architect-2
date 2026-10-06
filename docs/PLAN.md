# Architect 2.0 — scope and plan

Source of truth for *what* we build and *in which order*. Written 2026-10-04 from the brief
(https://hiring.lyzrarchitect.space/), architect.new's own docs (docs.architect.new, including the
v2.0–v2.2 changelogs) and its frontend bundles. Update it whenever scope changes.

---

## 1. The assignment, precisely

**Ask:** build **Architect 2.0**, the next version of architect.new, as a vibe-coding platform for
**both non-technical and technical users**. Keep every current Architect feature and add what
developers need.

**A user must be able to:**
1. Build an entire agentic application just by prompting.
2. Import an existing project and keep working on it.
3. Build agents in **any framework**.
4. Connect GitHub to their app.
5. Deploy the app.
6. Anything else it needs.

**Judged on, in order:**

| # | Criterion | Weight | What they literally want |
| - | --- | --- | --- |
| 1 | Technical architecture | Most important | A detailed diagram plus a `.md`: sandboxes, agent harness, model-agnosticism, frontend ↔ sandbox ↔ backend and live preview, the proxy, GitHub, deploying user apps **and** Architect itself, and scaling to thousands of users. *"Walk us through what happens from the moment a user types a prompt to their app running live."* "Don't just list services." |
| 2 | Design, UI/UX and flows | Most important | First-principles design: *"don't copy the current Architect's UI/UX, or any other platform's."* Covers every page and section, button placement, and how one step leads to the next. |
| 3 | Feature coverage | High | Dummy flows are fine. Named examples: auth, homepage, chat window, app preview, **agent section**, **UI getting built**, GitHub integration, deploying. "Don't stop at this list." |
| 4 | Working functionality | Plus points | For example a real DB or Google sign-in. Tests how much you can actually make work. |

**Submission form (everything is required):**
- Deployed URL with the major features in place.
- **Public** GitHub repo containing the diagram and the `.md`.
- Architecture diagram as a file (PNG, PDF, Excalidraw…, up to 25 MB).
- Architecture `.md` (up to 5 MB).
- *Why would a non-technical user pick your platform over Replit, Lovable or Emergent?*
- *Why would a technical user pick it over Claude Code, Codex or Cursor?*
- Self-ratings, resume, CTC and so on (personal; not for this repo).

---

## 2. What architect.new does today (baseline we must keep)

From docs.architect.new and the production bundles:

| Area | Current Architect |
| --- | --- |
| Entry | Prompt box with a **+** menu: attach files (PDF/DOCX → vector RAG; CSV/XLSX → dataframe agent), pick a theme (45+ presets or your own design system), prompt library, add existing Lyzr Studio agents. **AI Consultant** onboarding asks your role, bottlenecks and stack, then suggests apps with time-saved estimates. |
| Planning | **Planning mode** opens on the first prompt. It asks guided multiple-choice questions, then produces a live-updating **PRD** (user stories, agent architecture, agent table with model/tools/role), an **app mockup**, a **workflow diagram**, skill files and PDF/PPT exports. A "Plan Ready" state leads to **Start Building**. |
| Build | Three phases: **Plan → Agents** (agents, tools, knowledge bases; "Edit in Lyzr Studio") **→ App** (React/Next.js UI wired to agent outputs). A Plan/Build toggle while iterating. A **Test** toggle runs a testing agent in a real browser that self-fixes errors. Errors are self-healed, with a "Help me fix it" fallback. |
| Runtime | One **E2B sandbox** per app (template id in the bundle) with an in-sandbox harness, a live preview, and a 10-minute keep-alive. Managed NoSQL DB plus auth per app with **per-app DB isolation**, a Database tab, environment variables (encrypted), and an Artifacts tab. |
| Agents | Hosted **Lyzr Studio** agents by default, or **GitAgent** (beta): a git-native agent whose `SOUL.md`, `RULES.md`, `DUTIES.md`, `agent.yaml`, `skills/`, `memory/` and `knowledge/` live in your repo. Integrations (Gmail, Slack, HubSpot, Jira, Notion, …), custom Studio tools and MCP servers. |
| GitHub | Connect, create a repo, **auto-commit on every change**, manual pull/push, branch switching. v2.2 adds deploying without GitHub (platform-managed repo, "Export to my GitHub" later) and importing a **Next.js** GitHub repo or a zip. |
| Deploy | A Deploy modal with an `*.architect.new` subdomain (renamable), custom domain, analytics and "Publish to Marketplace". |
| Platform | Marketplace and cloning with creator **earnings**, credits/plans/billing (Stripe), per-agent usage breakdown, orgs and members, sharing, referrals, and design-system management. |

**Where it falls short for developers.** This is the gap Architect 2.0 must close:
- Agents are locked to Lyzr Studio. There's no LangGraph, CrewAI, OpenAI Agents SDK or custom code.
- The model isn't user-selectable per app or per step, and you can't bring your own key for the builder.
- There's no developer-grade view of the work: file tree, diffs and review, terminal, logs, agent trace, and token/cost per step.
- The code workflow is GitHub sync only. There's no PR-based flow, no local CLI/IDE round-trip, and import only works for Next.js.
- There's no visible test, eval or observability layer for the *agents* themselves.
- Memory is a platform black box, except GitAgent's `memory/` folder.

---

## 3. Our product thesis (adopted 2026-10-04)

> **"Architect remembers, so you never pay for the same mistake twice."**

Research (`docs/RESEARCH.md`) showed two things:
- The #1 complaint on every vibe-coding platform is paying for the AI's own mistakes. Doom loops
  repeat fixes that already failed, and context is lost after about 30 messages.
- 11+ rival submissions already pitch "two modes, one project", and none of them leads with memory.

So **memory is the engine** behind our answers to the top complaints, and the two lenses are table
stakes.

**Pillars, in the order we present them:**
1. **Fix memory and a loop breaker.**
   - Every error → attempted fix → outcome is remembered.
   - Before fixing, the harness recalls "tried X, failed; Y worked last time".
   - After 3 failed attempts it stops, rolls back to the last good checkpoint, and asks one
     clarifying question.
2. **Fair-billing ledger.**
   - Each step is tagged *you asked* vs *agent self-fix*, and self-fixes are free.
   - A cost preview before each build, a per-task budget cap, and tokens and cost shown on every
     step card.
3. **Builder memory and a decision log** (per user, across projects).
   - Stack and style preferences plus project decisions ("Auth: Supabase · Never store tokens in
     localStorage") are injected every turn, so context isn't lost after 30 messages.
   - New projects start pre-filled ("Same as last time: Next.js, Tailwind, Claude?").
4. **Visible memory.**
   - Nothing is hidden: inline "recalled" chips, a "why did you do that?" view, and a review of
     what was just learned.
   - The Memory panel lets you edit, delete, pin, use incognito, forget a project, and export
     (see §3.2).
5. **Agent memory toggle** on every agent you build, using Lyzr's three-tier model (short-term,
   long-term, session), so it maps 1:1 onto Lyzr Cognis when deployed on Lyzr.
6. **SEO/GEO toggle** for public-facing apps (see §3.3).
7. *Table stakes, presented last:* Simple/Pro lenses on one project, plan-before-build, framework-
   and model-agnostic agents, GitHub, deploy, a security pre-check, and click-to-edit.

**Memory provider:** **Memori** in the prototype (TypeScript SDK, runs on our own Supabase
Postgres, verified in `docs/memori-spike.md`). ARCHITECTURE.md describes a **pluggable memory
interface**, with **Lyzr Cognis** named as the production provider inside the Lyzr ecosystem.

**Answers for the submission form (draft):**
- *Non-technical user vs Replit, Lovable or Emergent:*
  - Those tools charge you when *their* agent breaks your app, and they forget what they already
    tried. Architect remembers every fix, never repeats a failed one, and doesn't bill you for its
    own mistakes.
  - It also remembers how *you* build, so the tenth app takes a sentence, and you can see and edit
    everything it knows.
  - It builds AI **agents**, not just screens.
- *Technical user vs Claude Code, Codex or Cursor:*
  - Memory there is per repo and manual (rules files). Here it's cross-project, automatic, and
    inspectable down to which memory drove which diff.
  - You get the same agent loop with a hosted sandbox, preview, deploy and PRs, any framework and
    any model, and a per-step token/cost trace.

### 3.1 How "agent-agnostic" works

There are two independent axes:
- **Framework-agnostic:**
  - The plan produces a neutral **AgentSpec**, a JSON/zod schema of agents (role, instructions,
    model, tools, knowledge, memory, guardrails) plus a graph of hand-offs.
  - **Adapters compile** the spec into Lyzr Studio config, LangGraph, CrewAI, OpenAI Agents SDK or
    plain TypeScript.
  - The UI (agent graph, config forms) edits the spec, never framework code. Pro users can edit the
    generated code, and a reverse-sync flags drift.
  - At runtime each framework runs inside the sandbox behind one HTTP contract
    (`POST /agents/{id}/run` with a streaming event schema), so the app UI never cares which
    framework is underneath.
- **Model-agnostic:**
  - A model gateway (Vercel AI SDK provider registry) sits behind one interface.
  - A capability matrix (tool calling, context, vision, structured output, price) drives per-step
    routing.
  - Tool calls and streaming are normalized, and fallbacks kick in on errors or refusals.
  - Bring-your-own key and per-user budgets are supported.
- In the prototype the AgentSpec and generated code are real, and the framework runs are simulated.

### 3.2 How memory is made visible (UX)

| Surface | What the user sees |
| --- | --- |
| **Recall dropdown** in each reply (owner choice) | A collapsed row, "🧠 Recalled 3 · Learned 2 ▾", under each assistant message. Expanding it lists each recalled memory (text, scope, source, *why it matched*) and each newly learned fact with inline **Keep / Edit / Forget**. Collapsed by default so chat stays clean. |
| **"Why?" on any step or diff** | Which memories, plan items and messages led to this change (provenance) |
| **Memory panel** | Tabs for **You** (cross-project), **This project** (decisions, fixes) and **Agents** (end-user memories of the agents you built). Each fact shows text, scope, source message, date, and times used, with edit, delete, pin and "never remember this" controls. |
| **Controls** | Global memory on/off, incognito session, forget project, export JSON, and a privacy note (Memori's augmentation is a hosted API) |
| **Decision log** | A timeline of decisions, each linked to the diff that implemented it |

### 3.3 SEO/GEO toggle (scope under discussion)

A per-project toggle for apps with **public pages** (landing pages, docs, marketing sites). Apps
behind a login don't benefit. *GEO* means "generative engine optimization": being cited by
ChatGPT, Perplexity, Google AI Overviews and similar.

- **Technical (automatic when the toggle is on):**
  - Server-side or static rendering for public routes, since a client-only SPA is invisible to many
    crawlers.
  - Semantic HTML.
  - `<title>`, meta description, canonical tags, Open Graph and Twitter cards.
  - `sitemap.xml` and `robots.txt`, with explicit allow/deny rules for AI crawlers (GPTBot,
    PerplexityBot, Google-Extended…).
  - **schema.org JSON-LD** (Organization, Product, FAQPage, Article, BreadcrumbList).
  - **`llms.txt`** summary.
  - Image alt text, Core Web Vitals budget, language/hreflang.
- **Non-technical (assisted content):**
  - Keyword and intent brief from the app description, and title/description suggestions.
  - An auto-generated **FAQ section**, written answer-first for AI citation.
  - Clear entity statements (who, what, where), facts with sources, readability score, and
    E-E-A-T prompts (author, about page).
- **Score and report:** an SEO/GEO score card in the Deploy step with fix-it buttons.
- **Memory tie-in:** brand voice, target keywords and audience are remembered across projects.
- **Prototype:** the toggle, generated meta, JSON-LD, sitemap, robots, llms.txt and the score card
  are real (deterministic checks plus an LLM for copy). Crawler and AI-citation tracking are
  simulated.

---

## 4. Feature scope (flows) and how real each one is

Legend: **R** = real (works end to end) · **P** = partly real · **S** = simulated with a realistic dummy flow.

| # | Flow | What the user sees | Real? | Session |
| - | --- | --- | --- | --- |
| 01 | **Auth** | GitHub + **Google** sign-in (Supabase), profile auto-created, sign out | R ✅ | 1–2 |
| 02 | **Homepage / new project** | Hero prompt box with **+** (attach file, template, import repo, pick framework and model), recent projects, "Architect remembers: Next.js, Tailwind, Claude" chips | P | 2 / 7 |
| 03 | **Planning** | Guided questions, then a live PRD (overview, user stories, **agent table**, data sources) and "Approve plan → Build". Memory pre-fills answers. | R (LLM) | 2 |
| 04 | **Chat window** | Streaming chat, model picker, Plan/Build toggle, token/cost meter, step cards ("Recalled 3 memories", "Wrote 4 files") | R | 2 |
| 05 | **UI getting built** | Files stream in, with a progress checklist from the plan; preview hot-updates | R (LLM + Sandpack) | 3 |
| 06 | **App preview** | Sandpack preview of the generated React UI, device sizes, open in new tab, error overlay with "Fix it" | R | 3 |
| 07 | **Agent section** | Agent graph (nodes = agents, edges = hand-offs), per-agent role/tools/KB/model/**memory toggle**, framework switcher with generated code, "Test this agent" playground | P (spec real, run S) | 4 |
| 08 | **Memory panel** | Builder memories and agent memories, with source, date, edit and delete; "forget project" | R (Memori) | 4 |
| 09 | **Import** | Import from a GitHub repo (list repos and branches via Octokit, read the tree, detect framework) or a zip; "Architect is reading your repo…" | P (read R, port S) | 5 |
| 10 | **GitHub** | Connect, create repo, push, auto-commit toggle, branch switcher, open a PR for each change (Pro) | R (push/PR) | 5 |
| 11 | **Deploy** | Deploy modal (subdomain, env vars, custom domain), streamed build logs, success screen with URL, deploy history and rollback | S (logs/URL) | 6 |
| 12 | **Pro mode** | File tree, Monaco code view, **diff per step** (accept/revert), terminal/logs, **agent trace** (plan → tool calls → files, tokens and cost per step) | P | 6 |
| 13 | **Settings** | Models and BYOK keys, default framework, memory on/off and export, usage | P | 7 |
| 14 | **Templates and onboarding** | Template gallery (support agent, research crew, RAG assistant…), first-run "what do you build?" which seeds memory | S/R | 7 |
| 16 | **Fix memory + loop breaker** | "Tried this before" card, attempt counter (1/3), auto-rollback, one clarifying question | R | 3–4 |
| 17 | **Fair-billing ledger** | Cost preview before build, per-step tokens/cost, "self-fix: free" tags, budget cap | P (metering R, billing S) | 2 / 6 |
| 18 | **Decision log + "Why?"** | Decision timeline linked to diffs; provenance popover on any step | R | 4 |
| 19 | **SEO/GEO toggle** | Toggle in project settings, generated meta/JSON-LD/sitemap/llms.txt, score card in Deploy | P | 6–7 |
| 20 | **Security pre-deploy check** | Scan for tables without RLS, exposed keys, secrets in client code; plain-language findings | P | 6 |
| 22 | **Content (CMS) mode** | For public sites: built-in content collections (pages, posts, FAQs) generated from the site, edited by non-technical users in a WYSIWYG editor with draft/publish; **Connect WordPress** (headless via WP REST/WPGraphQL) or **import from WordPress**; feeds the SEO/GEO toggle | P (built-in R, WordPress S) | 7 |
| 23 | **Hybrid / local bridge** | `architect` CLI: `pull`, `dev` (run locally), `push` (sync back), plus an MCP server so Cursor/Claude Code can drive the same project; cloud sandbox by default, local when you want | S (design) / P | 8 |
| 21 | *Stretch* | Testing agent, environment-variables panel, share/collaborators, marketplace | S | if time |

**Explicitly out of scope:** billing/credits, orgs/teams, marketplace earnings, design-system
import, and real per-app sandboxes. We mention them in ARCHITECTURE.md as the production design.

---

## 5. Architecture deliverables (criterion #1, the most important)

**`ARCHITECTURE.md`** must cover each item with the *why*, the alternatives considered, and how it
talks to its neighbours:

1. **Request lifecycle walkthrough.** "From prompt to live app" as a numbered sequence. This is the
   spine of the document.
2. **Sandboxes.**
   - One Firecracker microVM per project via **E2B** (the same choice as current Architect), from a
     prebuilt template with Node, Python and the framework SDKs.
   - Lifecycle: warm pool → assign → pause on idle → snapshot → resume.
   - Compared with Daytona, Modal, Fly Machines, WebContainers and plain containers.
   - Our prototype uses **Sandpack** in the browser for UI preview and simulates execution.
3. **Agent harness.**
   - Plan → act → observe → verify loop with a typed tool set: read/write/patch file, run command,
     install, search code, preview screenshot, run tests, recall/save memory.
   - Checkpoints (a git commit per step).
   - Error recovery: parse build/runtime errors, then retry with the error context, a fix budget,
     and escalation to the user.
   - Context management (repo map, compaction) and memory recall before each turn.
   - The testing agent as the verifier.
4. **Model-agnostic.**
   - Provider registry (Vercel AI SDK) behind a **model gateway**, with a capability matrix (tools,
     context, vision, cost).
   - Per-step routing: a strong model for planning, a fast one for edits.
   - Fallbacks on errors or refusals; a normalized tool-call format; BYOK; token budgets.
5. **Frontend ↔ backend ↔ sandbox.**
   - The Next.js app talks to the API, which streams over SSE/WebSocket.
   - A job queue drives workers that run the harness, which talks to the sandbox via the E2B SDK.
   - The preview iframe loads `https://{port}-{sandbox}.preview.architect…` through the proxy.
6. **The proxy.**
   - An edge **preview proxy** handles auth-checked subdomain routing to sandbox ports, websocket
     upgrade for HMR, and cookie isolation.
   - An **LLM proxy/gateway** keeps keys server-side, meters tokens per user, enforces rate limits
     and caching, and logs for the trace.
   - An **egress proxy** controls what sandboxes can reach.
7. **GitHub.**
   - A **GitHub App** (per-repo install, short-lived tokens) rather than an OAuth `repo` scope.
   - Import: clone into the sandbox and index.
   - Push: commit per step, PR per change, webhooks for external pushes, branch switching.
8. **Deployment.**
   - User apps: build in the sandbox, push to the repo, then the Vercel/Cloudflare API (frontend)
     plus agent runtime containers (Fly/Cloud Run), with a subdomain and env vars.
   - Architect itself: Vercel (web), workers on Fly/ECS, Supabase (Postgres, auth, storage), Redis
     (queue and rate limits), E2B, and observability (OpenTelemetry, PostHog, Sentry).
9. **Scaling to thousands of concurrent users.**
   - Stateless web tier and horizontally scaled harness workers.
   - A queue with per-tenant fairness and a sandbox warm pool with idle pausing.
   - Postgres pooling and read replicas, LLM rate-limit pooling across keys and providers, and
     backpressure.
   - A cost model (sandbox minutes and tokens per build), and failure modes.
10. **Memory layer: a pluggable `MemoryProvider` interface** (Memori in the prototype, Lyzr Cognis in
    production inside the Lyzr ecosystem). Builder memory vs agent memory, fix memory, attribution, recall and save points
    in the loop, privacy (the Memory panel and deletion), and the hosted-augmentation caveat.
11. **Security and multi-tenancy.** RLS, per-app DB isolation, secret storage, sandbox isolation,
    and prompt-injection boundaries for imported repos.

**Diagram:** one main system diagram plus a sequence diagram for "prompt → live app", authored in
Excalidraw (exported as PNG and the `.excalidraw` source in `docs/architecture/`) and mirrored as
Mermaid in the `.md` so it renders on GitHub.

---

## 6. Session plan (about 4-hour blocks)

Architecture is weighted highest and doesn't depend on code, so it starts early and is finished
last (not left to the end).

| Session | Goal | Done when |
| --- | --- | --- |
| **1** ✅ | Foundations: scaffold, Supabase schema + RLS, auth, app shell, Memori spike, docs skeleton | Done (build green) |
| **2** | **Architecture v1 + chat**: write ARCHITECTURE.md sections 1–6 and a draft diagram. Streaming chat via the AI SDK with a provider switcher, a token cap, and messages persisted. | A real model reply streams in the workspace; the doc has the full prompt-to-live walkthrough |
| **3** | **Planning + harness v1 + "UI getting built"**: guided questions → PRD + agent table (structured output) → "Approve" → generate files into `project_files` → Sandpack preview with a streaming file checklist | Prompt → plan → visible app in the preview |
| **4** | **Memory + agent section**: Memori recall/save in the loop, the Memory panel (list/edit/delete), the agent graph and config, the framework switcher with generated code (Lyzr, LangGraph, CrewAI, OpenAI Agents) | The second project is visibly pre-filled from memory; agent code switches by framework |
| **5** | **GitHub**: connect (store token), import a repo (list → read tree → detect), push to a new repo, PR per change, branch picker | A real repo is created and pushed from the app |
| **6** | **Deploy + Pro mode**: deploy modal and streamed simulated logs, URL, history; file tree, diff per step, logs, agent trace with tokens/cost | Both lenses work on one project; deploy looks real |
| **7** | **Homepage, onboarding, settings, templates, polish pass**: empty, loading and error states, mobile, a11y, seeded demo project for reviewers | A reviewer can explore everything in about 5 minutes |
| **8** | **Architecture final**: finish every section, polish the diagram, the security/scaling numbers and cost model; README; public repo check | The doc reads as a design review a senior engineer would accept |
| **9** | **Ship**: production deploy on Vercel, smoke test, Loom walkthrough, submission answers | Submitted |

If time gets tight, cut in this order: templates (7) → PR-per-change (5) → deploy history (6).
Never cut the architecture doc or Planning/preview (sessions 2–3).

---

## 7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Reviewers hit LLM costs or abuse the live URL | Per-user daily token cap, cheap default model for chat, a seeded demo project, rate limit in the LLM proxy |
| Memori's native engine and ~87 MB model on Vercel functions | Pre-warm/bundle the model or run Memori in a small Node service; fall back to Memori Cloud in production (ADR-003) |
| Supabase/GitHub OAuth setup not done yet | Blocks real auth testing; checklist in `docs/SETUP.md` |
| "Don't copy Architect's UI" | Our layout is lens-based (Simple/Pro) with memory surfaced; no PRD-first three-phase stepper clone |
| Scope creep | This file is the scope; anything new gets a row in §4 before it gets code |

---

## 8. Submission presentation order (owner rule, 2026-10-04)

Every submission artifact (README, ARCHITECTURE.md intro, Loom, form answers) leads with what
**only we** have and lists features shared with other candidates **last**:
1. Fix memory and the loop breaker → fair-billing ledger → builder memory and decision log →
   visible memory and "Why?" → agent memory toggle (Cognis-compatible) → SEO/GEO toggle.
2. **Design principle (lead the UX story):** familiar vibe-coding flow with no learning curve,
   plus a quick first-run tour. New ideas live inside the familiar flow.
3. *Then* the shared baseline: Simple/Pro lenses, plan-before-build, framework/model-agnostic
   agents, GitHub, deploy, security check, click-to-edit.

---

## 9. Open questions for the owner

1. **Deadline:** none is published (checked the brief, its page source and the careers page; the PM
   listing is closed). Rival repos are still appearing, so assume it's rolling and ship early. Ask
   the recruiter if possible.
2. LLM budget: which provider keys, and what monthly cap?
3. Is GitHub-only sign-in enough, or add Google/email? The brief cites Google sign-in as an example
   of a plus point.
4. Can the repo be made **public** now (it's required at submission)?

---

## 10. Owner notes log (structured record of ideas from our discussions)

Newest first. Each note: idea → where it lands in this plan → status.

| Date | Owner idea | Lands in | Status |
| --- | --- | --- | --- |
| 2026-10-06 | One memory system only, not plain Postgres; use **Lyzr Cognis** (open source); host the backend with **Docker on AWS free tier** and explain why not everything is on Vercel | `memory-service/` (FastAPI + Cognis + Caddy, EC2 setup script); Memori removed; ADR-006; ARCHITECTURE §4, §12 | 🔨 code done; EC2 launch pending |
| 2026-10-05 | SEO + GEO must be chosen **at the start** (not in Ship) and produce a predominantly **HTML** page; report at the end | New-project dialog + Plan switch; static-first build rules; pre-render snapshot → `/dist/index.html`; Ship shows only the report (audited on rendered HTML) | ✅ built |
| 2026-10-05 | "Build everything except Vercel; I'll host tomorrow" | Workspace: plan → build → preview → fix memory/loop breaker; Memory tab (memories, decisions, fixes, billing ledger); Agents (graph, memory toggle, 5 framework targets); Ship (security, SEO/GEO, deploy, GitHub push); Content (CMS + WordPress import); Pro logs/trace; ARCHITECTURE.md + diagram; SUBMISSION.md | ✅ built; deploy checklist in SUBMISSION.md |
| 2026-10-05 | UI theme after **rig.ai**; keep the generic vibe-coding flow (low learning curve); **quick tour** at start; mention both in the submission | theme tokens + landing/login/dashboard/workspace restyle; `components/product-tour.tsx`; README "Design principles" | ✅ built |
| 2026-10-05 | **Parallel prompts** "the Claude way": send new prompts while earlier ones run, each streams independently without interrupting | chat panel | ✅ built |
| 2026-10-05 | **Demo mode** (no account) | Supabase anonymous sign-in + seeded project + lower token cap | ✅ built (enable anonymous sign-ins in Supabase) |
| 2026-10-05 | **Command palette** (⌘K) | app header | ✅ built |
| 2026-10-05 | Groq key provided | Groq provider: GPT-OSS 120B/20B, Qwen 3.8 | ✅ verified live |
| 2026-10-04 | Start building (before the rough UI arrives) | Google sign-in, streaming chat + model switcher + token cap, MemoryProvider (Memori) with cross-project recall, recall dropdown, per-turn usage ledger | ✅ built (needs Supabase + an LLM key to run end to end) |
| 2026-10-04 | Memory recall as a **dropdown** under each reply | §3.2 | ✅ |
| 2026-10-04 | Google sign-in | row 01 | 🔨 building |
| 2026-10-04 | CMS like WordPress | row 22 | 🟡 proposed scope |
| 2026-10-04 | Hybrid cloud/local (inspired by Claude Code's teleport/remote) | row 23 | 🟡 proposed |
| 2026-10-04 | List all competitor features | `docs/COMPETITORS.md` | ✅ |
| 2026-10-04 | Owner will share a rough UI; build features to be UI-agnostic until then | §6 | ✅ noted |
| 2026-10-04 | Adopt "Architect remembers, so you never pay for the same mistake twice", and keep it evolving with every new idea | §3 | ✅ adopted |
| 2026-10-04 | Mention Cognis, but build on Memori because it fits our TypeScript/Postgres architecture | §3, §5.10, ADR-004 | ✅ |
| 2026-10-04 | Submission lists unique features first and shared ones last | §8 | ✅ |
| 2026-10-04 | SEO/GEO optimization as a toggle; scope to discuss | §3.3, row 19 | 🟡 scope open |
| 2026-10-04 | Explain agent-agnosticism and how hidden memory is shown | §3.1, §3.2 | ✅ |
| 2026-10-04 | Manually explore other platforms (roadmap) | `docs/EXPLORATION.md` | ✅ checklist ready |
| 2026-09-29 | "Architect remembers" (Memori), Simple/Pro, fixed stack | §3, CLAUDE.md | ✅ |
