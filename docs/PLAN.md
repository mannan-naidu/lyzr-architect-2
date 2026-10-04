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

## 3. Our product thesis

> ⚠️ **Under revision (2026-10-04):** research found that 11+ other candidates already pitch
> "two modes, one project", so that part is table stakes. The proposed new lead is "Architect
> remembers, so you never pay for the same mistake twice". See `docs/RESEARCH.md` §4; the owner
> decision is pending.

**"One project, two lenses, and Architect remembers."**

- **Two lenses on the same project, not two products.**
  - **Simple** is a conversation, a live preview and plain-language status ("Building your dashboard…").
  - **Pro** is the same project with the file tree, diffs, terminal/logs, the agent trace, the model per step, and the framework code.
  - Switching never loses state. A non-technical founder can hand the project to an engineer, who just flips to Pro.
- **Framework-agnostic agents.**
  - The agent spec (role, tools, memory, model) is framework-neutral, and **compiles** to Lyzr, LangGraph, CrewAI, OpenAI Agents SDK or plain TypeScript.
  - Pro users can edit the generated framework code. Simple users never see it.
- **Model-agnostic everywhere.** The builder and each generated agent can use Claude, GPT, Gemini or open-source models via OpenRouter, with bring-your-own-key and per-step routing.
- **Architect remembers** (our differentiator; Memori on Postgres):
  - *Builder memory* (per user, across projects): stack and style preferences, past decisions, and fixes that worked. For example, "You used Tailwind and Supabase last time — same here?" or "This error matches one we fixed on 12 Sep."
  - *Agent memory* (per generated agent, opt-in toggle): the agents you build remember their own end users.
  - A **Memory panel** shows every stored fact with its source and date, plus edit, delete and "forget this project". It's transparent and user-owned, the opposite of a black box.

**Answers for the submission form (draft):**
- *Non-technical user vs Replit, Lovable or Emergent:* it builds **agents**, not just CRUD screens. It plans with you before building, shows progress in plain language, and **remembers you**, so the tenth app takes a sentence rather than an essay. You can also see and delete everything it knows.
- *Technical user vs Claude Code, Codex or Cursor:*
  - It's the same agent loop, with a hosted sandbox, live preview, deploy and GitHub PRs included, and no local setup.
  - You pick the agent **framework and model**, read diffs and the agent trace, and own the code in your repo.
  - Project memory persists across sessions and teammates instead of living in one terminal.

---

## 4. Feature scope (flows) and how real each one is

Legend: **R** = real (works end to end) · **P** = partly real · **S** = simulated with a realistic dummy flow.

| # | Flow | What the user sees | Real? | Session |
| - | --- | --- | --- | --- |
| 01 | **Auth** | GitHub sign-in (Supabase), profile auto-created, sign out | R ✅ | 1 |
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
| 15 | *Stretch* | Testing agent, environment-variables panel, share/collaborators, marketplace | S | if time |

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
10. **Memory layer (Memori).** Builder memory vs agent memory, attribution, recall and save points
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

## 8. Open questions for the owner

1. What's the **submission deadline**, and how many sessions are realistic? That decides whether
   sessions 7–8 merge.
2. LLM budget: which provider keys, and what monthly cap?
3. Is GitHub-only sign-in enough, or add Google/email? The brief cites Google sign-in as an example
   of a plus point.
4. Can the repo be made **public** now (it's required at submission)?
