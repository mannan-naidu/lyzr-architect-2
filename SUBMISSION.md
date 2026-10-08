# Architect 2.0: submission

> **From prompt to production: AI apps that get found, remember, and run any agent.**
>
> Describe an app; Architect plans it, builds it and ships it, with SEO + GEO built in, a memory that learns how you build, and agents in Lyzr, LangGraph, CrewAI or OpenAI Agents.

| Field | Value |
| --- | --- |
| Deployed URL | _add after the Vercel deploy (see "Deploy checklist" below)_ |
| Public repo | https://github.com/mannan-naidu/lyzr-architect-2 |
| Architecture diagram | [`docs/architecture/architecture.png`](docs/architecture/architecture.png) (source: [`diagram.html`](docs/architecture/diagram.html)) |
| Architecture doc | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Try it without an account | **Try the demo** on the login page (anonymous session, seeded project) |

---

## My understanding of Lyzr, Architect and who it's for

**What Lyzr does.** Lyzr is an enterprise **agent infrastructure** company: "an agent
infrastructure platform focused on production" (CEO Siva Surendira). Its core business is helping
large organisations design, deploy and run AI agents **inside their own environments** (private
cloud or on-prem), especially in regulated industries. It does this through three layers:
- **Lyzr Agent Studio:** a low-code platform where teams build, deploy and scale their own agents.
- **Lyzr Blocks:** the building blocks agents use, such as **Cognis** (memory), knowledge bases and
  guardrails. Cognis is the default memory for Studio agents and is also open source.
- **Agentic Transformation Consultants (ATCs):** a services team that gets customers from idea to
  a working prototype. By the CEO's own account, about 90% of customers go live because of them.

Customers are enterprises and consulting firms (reported: KPMG, Deloitte; Accenture is an investor
and co-seller), with deals in the hundreds of thousands of dollars.

**What Architect (architect.new) is.** A "vibe-coding" platform launched in February 2026. You
describe a business process in plain English, and it builds a full-stack **agentic app**: a web UI,
plus a multi-agent backend whose agents run on Lyzr Studio. A QA agent fixes the generated code
before you see it. Under the hood it draws on Lyzr's library of 1,000+ agent blueprints.

**Who Architect is for.** Primarily **non-technical business users inside enterprises**: the
launch example is an insurance underwriter building an underwriting-analysis system. Then two
groups who build *for* them:
- **Consultants:** Lyzr's ATCs and partner firms, who need prototypes in a day, not a quarter.
- **Developers and technical teams:** they have to take those apps to production, own the code,
  and fit it into their stack. The 2.0 brief explicitly adds them.

A self-serve audience (founders, prosumers, students at Lyzr's workshops) is the top of the
funnel.

**Why Lyzr is building it** (my reading, from the sources below):
1. **Productising the consultants.** If 90% of go-lives depend on ATCs, growth is limited by
   headcount. Architect packages the blueprint library and ATC know-how into a product, so more
   customers reach production without a consultant, at software margins.
2. **Crossing the prototype-to-production gap.** Lyzr positions itself against Microsoft Copilot
   and Salesforce Agentforce, which it says "struggle to move beyond early prototypes". Architect
   produces a working app on production agent infrastructure instead of a demo.
3. **Feeding the core platform.** Every agent Architect builds runs on Lyzr Studio and Blocks, so
   Architect brings usage (and credits) to the business that already makes money. It's also a
   self-serve way in, alongside enterprise sales.
4. **An interface for the whole organisation.** In the CEO's words, Lyzr becomes "an interface
   for not only multiple models, but also agents that the organization can publish to employees".
   Architect is how those agents get a usable front end.

**How Architect 2.0 fits that strategy.**
- **For the business user:** a familiar flow with a guided tour. Memory means the tenth app is
  faster than the first and repeat failures are fixed for free. Apps can be public and *found*
  (SEO + GEO), which extends Architect from internal tools to customer-facing apps.
- **For consultants:** builder memory and the decision log carry a client's standards across
  projects. Fix memory turns one consultant's fix into everyone's next fix.
- **For developers:**
  - Pro mode (diffs, trace, logs), GitHub ownership and any model.
  - **Compile to** any framework (LangGraph, CrewAI, OpenAI Agents SDK, TypeScript). This lowers
    the lock-in objection, while **Lyzr stays the default**, with Cognis memory on deploy.
- **For Lyzr:** Architect's own memory runs on **Lyzr Cognis**, Lyzr's product proving itself
  inside Lyzr's builder. That's a capability architect.new doesn't use today.

**Tension worth naming.** Framework-agnostic export helps adoption and developer trust, but it can
pull usage away from Lyzr Studio. My answer: Lyzr is the default and the only one-click deploy
target (with Cognis memory, guardrails and on-prem). The other frameworks are an exit ramp that
makes enterprises comfortable saying yes.

Sources: [SiliconANGLE launch article (Feb 2026)](https://siliconangle.com/2026/02/06/exclusive-startup-lyzr-ai-launches-app-builder-aimed-moving-agents-production-volume/) ·
[Lyzr Architect docs](https://docs.lyzr.ai/enterprise/architect/introduction/overview/introduction) ·
[Product Hunt launch](https://www.producthunt.com/posts/architect-by-lyzr) ·
[Lyzr Series A+ press release](https://norfolkdailynews.com/online_features/press_releases/lyzr-ai-raises-series-a-at-250-million-valuation/article_05360f6f-a55c-5979-9033-1726e051a40f.html) ·
[Latka founder interview](https://getlatka.com/interviews/lyzrai-siva-surendira-ceo-2026) ·
[Lyzr Cognis](https://docs.lyzr.ai/enterprise/lyzr-blocks/cognis/overview) · our own research in
[`docs/RESEARCH.md`](docs/RESEARCH.md). Revenue and customer figures are self-reported by Lyzr.

---

## What only Architect 2.0 does (presented first)

1. **Fix memory and a loop breaker.**
   - Every preview error is fingerprinted.
   - "Fix it" diagnoses the cause first, then uses your fix history as hints: a fix that worked for
     the same error in the same place (in *any* of your projects) is reused only if the cause
     matches, and fixes that already failed there are never repeated.
   - After 3 failed attempts it stops, rolls back to the last working version, and asks one
     question instead of burning more credits.
2. **Fair-billing ledger.**
   - Every model call is itemised as *you asked* or *agent self-fix*.
   - Self-fixes are billed to Architect and draw from a separate budget, never your daily cap.
3. **Builder memory and a decision log.**
   - Architect remembers how *you* build (stack, style, deploy target) across projects.
   - Approved plan decisions are injected into every turn, so it stops re-asking what you settled.
4. **Visible memory.**
   - A "Remembered N things" dropdown under every reply, and the memories that shaped each plan.
   - A Memory tab where you can edit, delete or *forget this project*, plus a per-project memory
     switch.
5. **Agent memory toggle.** Each agent you build can remember its own end users. The switch
   compiles to each framework's native memory, and to Lyzr Cognis on Lyzr.
6. **SEO + GEO from the start.** Switch it on when you create the project. Architect then builds the
   site static-first (all content as real HTML on first load) and deploys a pre-rendered page with
   meta tags, sitemap, robots, JSON-LD and `llms.txt`. Your site is found on Google *and* quoted by
   ChatGPT, Perplexity and Claude. Ship gives you a report scored on the HTML crawlers actually
   receive.
7. **Content mode (CMS).** Pages, posts and FAQs editable without code, with **import from
   WordPress** (REST API). Published FAQs feed the GEO structured data.

**Design principle.** The flow is the familiar vibe-coding one (prompt → plan → build → preview →
ship), so there's no learning curve. A **quick first-run tour** points out the five places that
matter. The new ideas live *inside* that flow, not in a new one.

8. **Feature search (⌘K).** architect.new has no search. Ours points you straight to the feature:
   "how much am I paying" opens the billing ledger, "undo" opens fix history, "what changed"
   switches to Pro and opens the diffs. It's text matching today, with semantic search
   (vector + BM25, the same engine as memory) designed for production.

## What's also there (shared baseline, presented last)

- **Simple / Pro lenses on one project.** Pro adds diffs, edit-by-hand, logs and an agent trace.
- **Plan before build:** screens, agents and decisions, approved before any code is written.
- **Live preview** with device sizes and a streaming "UI getting built" checklist.
- **Any model:** Anthropic, OpenAI, Google, Groq and OpenRouter, switchable per message.
- **Any framework:** one agent spec compiles to Lyzr, LangGraph, CrewAI, OpenAI Agents SDK or
  TypeScript.
- **Parallel prompts:** send a new prompt while one runs; neither interrupts the other.
- **GitHub:** create a repo and push in one commit (UI, agents, SEO files).
- **Deploy:** security pre-check (blocks on secrets in client code), SEO/GEO score, logs, URL,
  history.
- **Other:** Google, GitHub and demo sign-in; ⌘K command palette; dark-first "ink & paper" design.

---

## Form answers

### Why would a non-technical user pick Architect over Replit, Lovable or Emergent?

Because it takes you from an idea to an app people can actually find, and it gets better at
building for you every time.

- **Found, not just built.** Switch on SEO + GEO when you start, and Architect builds a page that
  Google and AI answer engines (ChatGPT, Perplexity, Claude) can read and quote: no SEO knowledge
  needed. Edit the content yourself in a WordPress-style editor.
- **Agents, not just screens.** Your app comes with working AI agents, and you can see and switch
  on their memory.

And when something breaks, you don't pay for the AI's mistakes. Architect remembers every fix it
has tried for you:
- When an error comes back, it works out *why*, reuses a past fix only if the cause matches, and
  skips the ones that already failed.
- After three failed tries it stops, rolls back to your last working version, and asks you one
  plain question.
- Those fixes are free: the billing ledger shows exactly what you paid for and what Architect
  absorbed.

It also remembers *you*: how you like your apps to look, where you deploy, what you already
decided. Your tenth app takes a sentence, not a page, and you can see, edit or delete everything it
remembers.

It builds working **AI agents**, not just screens, and gets them found with one SEO/GEO switch and
a WordPress-style content editor. And it feels like the tools you already know, with a short tour
on day one.

### Why would a technical user pick Architect over Claude Code, Codex or Cursor?

Memory and accountability that those tools leave to you:
- In Cursor or Claude Code, memory is per repo and hand-written (rules files, `CLAUDE.md`).
- Architect's memory is automatic, spans projects, and is inspectable: you can see which memories
  were recalled for each reply and plan.

It also adds:
- **Fix memory** that finds candidates by error signature *and* location, then makes the model
  diagnose before reusing anything (one message can have different causes). It stops doom loops
  across sessions.
- **A per-step ledger and trace** (Pro mode: logs, per-run timeline, tokens, diffs against the
  previous version), so you can audit what the agent did and what it cost.
- **Agents are first-class.** One spec compiles to Lyzr, LangGraph, CrewAI, OpenAI Agents SDK or
  TypeScript, with a runtime contract (`POST /agents/{name}/run`) so the UI never depends on the
  framework.
- **Any model** behind one gateway.
- **The hosted loop:** plan, preview, security check, GitHub push and deploy in one place, with an
  architecture designed for E2B sandboxes and a CLI/MCP bridge so Cursor or Claude Code can drive
  the same project.

---

## Loom script (about 5 minutes)

1. **(0:00) Hook.** "From prompt to production: AI apps that get found, remember, and run any agent." Then one line each: get found (SEO + GEO), remember (memory across
   projects), run any agent (compile to any framework).
2. **(0:20) Familiar start.** Landing → Try the demo → workspace. The tour runs: chat, plan,
   preview, memory, ship. "Nothing new to learn."
3. **(0:50) Plan.** Show the SEO + GEO switch at the start (set when the project was created). Generate the plan. Point out "What I remembered" and the agents table. Approve
   & build.
4. **(1:30) UI getting built.** The file checklist streams; the preview renders. In chat, ask two
   questions back to back: the second runs in parallel without interrupting the first.
5. **(2:10) Fix memory.** Break the app in Pro → Edit by hand (e.g. a typo in a component). Click
   **Fix it · free** and show the toast "Self-fix, not billed to you". Then Memory → Fix history and
   Billing ledger ("Absorbed by Architect").
6. **(2:50) Visible memory.** Memory tab: facts learned here vs everywhere; edit one, forget the
   project. The decision log.
7. **(3:20) Agents.** The graph, the memory toggle per agent, and the code switching between Lyzr,
   LangGraph, CrewAI and OpenAI Agents.
8. **(3:50) Ship.** Security pre-check, the SEO + GEO report (audited on the rendered HTML; show `/dist/index.html` and `llms.txt` in Code after deploying), Deploy
   (streamed logs, URL), GitHub push (open the real repo).
9. **(4:30) Architecture.** The diagram: the memory layer, harness, gateway, and production
   scale-out (E2B, queue, proxies).

---

## Deploy checklist (Vercel)

1. Supabase:
   - SQL Editor → paste and run [`supabase/setup.sql`](supabase/setup.sql) (idempotent; safe to
     re-run).
   - Authentication → Sign In / Providers → enable **Anonymous sign-ins** (demo mode), **Google**
     and **GitHub**.
   - Authentication → URL Configuration: add `https://<your-vercel-domain>/auth/callback` to the
     redirect URLs, and set the Site URL.
2. Vercel → New Project → import `mannan-naidu/lyzr-architect-2` → Framework: Next.js (pnpm is
   detected).
3. Environment variables (Production + Preview). See [`.env.example`](.env.example):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MEMORY_SERVICE_URL`, `MEMORY_SERVICE_TOKEN`: printed by `memory-service/setup.sh` on the AWS server (see docs/SETUP.md §8).
   - At least one LLM key (`GROQ_API_KEY` is the cheapest and fastest for the demo; add
     `ANTHROPIC_API_KEY` etc. as available).
   - `GITHUB_TOKEN_KEY`: 32 random bytes, base64 (`openssl rand -base64 32`).
   - Optional: `DAILY_TOKEN_CAP`, `DEMO_TOKEN_CAP`.
4. GitHub OAuth app (used by Supabase): callback
   `https://<project-ref>.supabase.co/auth/v1/callback`.
5. Deploy, then smoke test:
   - demo login → plan → build → preview → Memory tab → Ship.
6. Put the URL in the table at the top of this file.

**Before submitting:**
- Rotate any key that was ever pasted into a chat.
- Confirm the repo is public.
- Record the Loom.
