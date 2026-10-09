# Architect 2.0: submission

> **From prompt to production: AI apps that get found, remember, and run any agent.**
>
> Describe an app; Architect plans it, builds it and ships it, with SEO + GEO built in, a memory that learns how you build, and agents in Lyzr, LangGraph, CrewAI or OpenAI Agents.

| Field | Value |
| --- | --- |
| Deployed URL | https://lyzr-architect-2o.vercel.app |
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

**Why does Architect only build Lyzr agents?** Lyzr hasn't said publicly, so I don't know the
actual reason. Every product decision like this is a business decision, though, and these are the
reasons I'd expect:
1. **Revenue and the funnel.** Agents running on Lyzr Studio consume Lyzr credits and lead to
   enterprise deals. An agent exported to LangGraph earns Lyzr nothing after the build.
2. **The enterprise promise.** Guardrails, Responsible AI checks, audit logs, Cognis memory and
   on-prem deployment are what Lyzr sells to regulated customers. It can only guarantee them on its
   own runtime.
3. **Quality and focus.** One runtime means one target to test, one QA agent and one set of 1,000+
   blueprints. Five frameworks would multiply the failure modes for a young product.
4. **Simplicity for the core user.** A non-technical underwriter doesn't know what LangGraph is,
   and a framework choice is just friction for them.

**Why Architect 2.0 adds other frameworks anyway.** The brief adds developers, and their first
objection is lock-in. "Compile to" answers that objection without giving up the reasons above:
- **Lyzr stays the default** and the only one-click deploy target, with Cognis memory, guardrails
  and on-prem.
- **Other frameworks are an export**, an exit ramp that makes an enterprise comfortable saying yes.
- **Every exported agent keeps the same spec**, so moving back to Lyzr is easy.

Sources: [SiliconANGLE launch article (Feb 2026)](https://siliconangle.com/2026/02/06/exclusive-startup-lyzr-ai-launches-app-builder-aimed-moving-agents-production-volume/) ·
[Lyzr Architect docs](https://docs.lyzr.ai/enterprise/architect/introduction/overview/introduction) ·
[Product Hunt launch](https://www.producthunt.com/posts/architect-by-lyzr) ·
[Lyzr Series A+ press release](https://norfolkdailynews.com/online_features/press_releases/lyzr-ai-raises-series-a-at-250-million-valuation/article_05360f6f-a55c-5979-9033-1726e051a40f.html) ·
[Latka founder interview](https://getlatka.com/interviews/lyzrai-siva-surendira-ceo-2026) ·
[Lyzr Cognis](https://docs.lyzr.ai/enterprise/lyzr-blocks/cognis/overview) · our own research in
[`docs/RESEARCH.md`](docs/RESEARCH.md). Revenue and customer figures are self-reported by Lyzr.

---

## Positioning in a crowded market

This space is crowded and the competitors are giants:
- **App builders:** Lovable, Replit, Bolt, v0 (Vercel), Base44 (Wix), Emergent.
- **AI coding tools:** Cursor, Windsurf, Trae (ByteDance), GitHub Copilot, Claude Code, Codex.
- **Model companies:** Anthropic, OpenAI and Google, which ship builders of their own.

Architect can't win on "best code generator", because everyone uses the same frontier models. It
needs one clear position:

| Category | Examples | Who drives | What you get | Where it runs |
| --- | --- | --- | --- | --- |
| **AI app builders** | Lovable, Replit, Bolt, v0, Emergent | Anyone, in the browser, by prompting | A whole hosted app; you rarely read the code | Their cloud, one click |
| **AI coding tools** | Cursor, Trae, Windsurf, Claude Code, Codex, Copilot | Developers, in their own repo | Code changes inside an IDE or terminal | Your machine; you own build, deploy and infra |
| **Agent builders** | Lyzr Studio, n8n, Relevance AI, OpenAI AgentKit | Ops and technical teams | Agents and workflows, not a full app | The vendor's runtime |
| **Architect 2.0** | — | Business users, with developers in Pro mode | An **agentic app**: a UI plus agents, ready for production | Lyzr runtime by default; exportable |

**Our position:** *the app builder for production AI apps*. Architect builds apps that get found
(SEO + GEO), that remember (Cognis), and whose agents run on Lyzr or any framework, backed by an
enterprise agent company. App builders stop at a hosted prototype. Coding tools assume you're a
developer. Agent builders don't give you an app. Architect covers all three.

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
   WordPress** (REST API). Published FAQs feed the GEO structured data and `llms.txt` on every
   deploy. In production, the deploy step also renders CMS pages and posts into the app's HTML;
   for now that part is a placeholder.

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

## Form answers (paste-ready)

The form's project fields, in its order:

| Form field | Answer |
| --- | --- |
| Deployed URL | https://lyzr-architect-2o.vercel.app |
| GitHub repository | https://github.com/mannan-naidu/lyzr-architect-2 (public; diagram and `.md` included) |
| Architecture diagram | Upload [`docs/architecture/architecture.png`](docs/architecture/architecture.png) |
| Describe your architecture (.md file) | Upload [`ARCHITECTURE.md`](ARCHITECTURE.md). It covers every topic the form names: sandboxing §6, agent harness §5, proxies §10, model-agnosticism §7–8, GitHub §11, deployment §12, scaling §13 |

### Why would a non-technical user pick your platform? (vs Replit, Lovable, Emergent)

App builders are a crowded space, and Lovable, Replit and Emergent are good at getting an app to
"it runs". Architect sits where three kinds of tools meet: the ease of an app builder, the agents
of an agent platform (Lyzr), and the control of a developer tool when you need it. It takes you from
prompt to production, with AI apps that get found, remember, and run any agent.

1. **Get found.** Switch on SEO + GEO when you start a project. Architect builds the site
   HTML-first and adds meta tags, a sitemap, structured data and `llms.txt`, so Google can rank it
   and ChatGPT, Perplexity and Claude can quote it. Ship gives you a plain-English score. You edit
   pages and FAQs in a content editor (or import them from WordPress), no code needed.
2. **It remembers you.** Architect learns how you build (look and feel, where you deploy, what you
   already decided) across all your projects, using Lyzr Cognis. Your tenth app takes a sentence,
   not a page. Every reply shows what it remembered, and you can edit or delete any of it.
3. **Agents when you need them.** If your app needs AI (a support bot, a lead qualifier),
   Architect designs the agents and gives each a one-click memory switch. If it doesn't, you get a
   regular app.
4. **Fixes you can trust.** When something breaks, Architect works out *why* before reusing an old
   fix and never repeats one that failed. After three tries it rolls back to your last working
   version and asks you one plain question. Its own fixes don't use your credits, and a ledger
   shows exactly what you paid for.
5. **Search that takes you there.** Type "undo" or "how much am I paying" and ⌘K opens that
   feature.

Nothing to relearn: it's the same prompt → plan → preview → ship flow you know, with a 30-second
tour on day one, plus the usual live preview, model choice and GitHub push.

### Why would a technical user pick your platform? (vs Claude Code, Codex, Cursor)

Claude Code, Codex and Cursor are excellent at editing a repo you already have, and Architect
doesn't try to beat them at that. Architect sits where app builders, agent platforms and coding
tools meet: a business user can start the app, and you get the agents, the memory and the code
underneath. It covers what sits around the code: agents in any framework, memory that spans
projects, and production defaults.

1. **Run any agent.** One agent spec compiles to Lyzr, LangGraph, CrewAI, OpenAI Agents SDK or
   TypeScript behind one contract (`POST /agents/{name}/run`). The UI never depends on the
   framework, so switching framework isn't a rewrite.
2. **Memory as infrastructure, not a rules file.** Instead of a hand-maintained `CLAUDE.md` or
   `.cursorrules` per repo, Architect runs Lyzr Cognis (open source, self-hosted on AWS): hybrid
   vector + BM25 search, versioned facts (add / update / contradict), scoped user → agent →
   project. Every reply shows which memories were recalled; you can edit, delete or forget a
   project.
3. **Fix memory that diagnoses.** Errors are fingerprinted by normalised message *and* location.
   Past fixes are hints only: the model diagnoses first and reuses a fix only when the cause
   matches, failed fixes are never retried in the same place, and a loop breaker rolls back after
   3 attempts, across sessions.
4. **Found by default.** Static-first build, pre-rendered HTML, JSON-LD, sitemap and `llms.txt`,
   with an SEO/GEO audit run on the HTML crawlers actually receive.
5. **Auditable.** Pro mode shows diffs, logs, a per-run trace, token counts and a ledger that
   separates your prompts from the agent's self-fixes.

Also there: any model (Anthropic, OpenAI, Google, Groq, OpenRouter) behind one gateway,
plan-before-build, a security pre-check and a one-commit GitHub push. The design adds E2B sandboxes
and a CLI/MCP bridge so Claude Code or Cursor can drive the same project: Architect complements
those tools rather than replacing them.

### Any other comments? (optional)

How I read the opportunity: Lyzr builds production agents inside clients' environments, Agent
Studio lets teams build their own, and Architect is the vibe-coding front door to both, for
business users and consultants who need a working app and not just a demo.

This is a crowded space with giants: Lovable and Replit build apps, Cursor and Claude Code serve
developers, and the model companies ship their own builders. Architect can't win on "best code
generator", because everyone uses the same models. It has to win on a clear position, and the
open spot is the intersection: app builders (Lovable, Replit) give you an app but no real agents,
agent platforms (Lyzr Studio, n8n) give you agents but no app, and coding tools (Cursor, Claude
Code) assume you're a developer. Architect is all three in one project: production AI apps, backed
by an enterprise agent company. So I built Architect 2.0 around three gaps between
a prototype and production: being found (SEO + GEO), memory (Lyzr's own open-source Cognis,
self-hosted on AWS), and agents in any framework, with Lyzr as the default.

I don't know why Lyzr currently limits Architect to Lyzr agents. I assume it's a business
decision (revenue on its runtime, enterprise guardrails, focus), so I kept Lyzr as the default and
made other frameworks an export. The full reasoning is in `SUBMISSION.md` in the repo.

What's live and what's a placeholder for now: sign-in, database, multi-model chat, planning and
building, live preview, SEO + GEO files, the CMS, Cognis memory and GitHub push are live. Agent runs,
the E2B sandbox and hosting of user apps are placeholders for now, as the brief allows, and each
has its production design in `ARCHITECTURE.md`. `ARCHITECTURE.md` §12 explains why
Architect runs on Vercel but memory runs on AWS.

---

## Loom script (about 6 minutes)

Spoken lines are in quotes; what to show is in brackets.

**1. Hook (0:00–0:20)** [Landing page]
"Hi, I'm Mannan. This is Architect 2.0: from prompt to production, AI apps that get found,
remember, and run any agent."

**2. How I read Lyzr (0:20–0:55)** [Stay on the landing page]
"Lyzr builds production AI agents inside its clients' environments. Agent Studio lets teams build
their own, and Architect is the vibe-coding front door to both. It's for business users and
consultants who need a working app, not a demo, and it brings usage to Lyzr's agent platform.
Today Architect only builds Lyzr agents. I don't know Lyzr's exact reason, but a decision like
that is a business one: revenue on its own runtime, guardrails it can guarantee for enterprise
customers, and focus. So in 2.0, Lyzr stays the default, and other frameworks are an export."

**3. Positioning (0:55–1:25)** [The positioning table in SUBMISSION.md, or one slide]
"This is a crowded space with giants. Lovable and Replit build apps but not real agents. Agent
platforms like Lyzr Studio and n8n build agents but not the app. Cursor and Claude Code assume
you're a developer. And everyone uses the same models, so nobody wins on 'best code generator'.
Architect sits at the intersection: the ease of an app builder, real agents, and a developer's
control when you need it."

**4. Familiar start (1:25–1:50)** [Try the demo → New project. Tick SEO + GEO and Content mode
in the dialog → workspace; the tour runs]
"The flow is the one you already know: prompt, plan, preview, ship. A 30-second tour points out
the five places that matter. I switch on SEO + GEO here, at the start, because it changes how the
app is built."

**5. Plan (1:50–2:30)** [Plan tab: generate. Point to "What I remembered", the agents table
(or "No AI agents"), and the open question. Click one answer → the plan updates → Approve & build]
"Architect plans before it builds. It recalls how I've built before from Lyzr Cognis memory and
applies it. It adds AI agents only when the app needs them. When something is unclear, it asks
one question with one-click answers, then I approve."

**6. Build and preview (2:30–2:55)** [The "UI getting built" checklist, live preview. In chat,
send two questions back to back]
"The UI streams in file by file, and the preview runs live. I can keep chatting while it works;
prompts run in parallel."

**7. Fix memory (2:55–3:35)** [Pro → Code → Edit by hand: break a line → preview error → Fix it →
the toast shows the cause → Memory → Fix history and Billing ledger]
"When something breaks, Architect diagnoses the cause first. A past fix is only a hint: it's
reused if the cause matches, and fixes that failed here are never repeated. After three tries it
rolls back and asks me. Self-fixes are billed to Architect, not to me, and the ledger shows that."

**8. Visible memory (3:35–4:00)** [Memory tab: edit one memory (it becomes v2), show the
"forget this project" button and the decision log]
"Memory isn't a black box. I can see what it learned, edit it, delete it, or forget a project.
It runs on Lyzr's own open-source Cognis, self-hosted on AWS."

**9. Agents in any framework (4:00–4:25)** [Agents tab: graph, memory toggle, Compile to: Lyzr →
LangGraph → CrewAI → OpenAI Agents]
"One agent spec compiles to Lyzr, LangGraph, CrewAI or the OpenAI Agents SDK, behind one API, so
choosing a framework is never a rewrite. Each agent's memory is one switch."

**10. Search (4:25–4:40)** [⌘K, type "how much am I paying" → the ledger opens]
"architect.new has no search, so I added one that takes you to the feature. It's text matching
today; production adds semantic search on the same engine as memory."

**11. Ship (4:40–5:15)** [Ship: security pre-check, Deploy, SEO + GEO report. Code → `/dist/index.html`
and `llms.txt`. Content tab: an FAQ. Push to GitHub → open the repo]
"Ship runs a security check, then deploys a pre-rendered page with meta tags, a sitemap,
structured data and llms.txt. The report scores the HTML crawlers actually see, so the app gets
found on Google and quoted by AI answer engines. FAQs from the content editor feed that data. And
the code goes to my own GitHub repo in one commit."

**12. Architecture (5:15–5:50)** [The architecture diagram]
"The app runs on Vercel, the data on Supabase Postgres with row-level security, and memory on
Cognis in Docker on AWS, because Cognis is Python and needs a long-running server and local
storage, which serverless can't give it. A model gateway sits in front of five providers. In
production, E2B sandboxes run the apps, a queue runs the builds, and the memory service scales out."

**13. Close (5:50–6:05)** [Back to the landing page]
"Sign-in, chat, planning, building, preview, memory, SEO, the CMS and GitHub push are live. Agent
runs and hosting are placeholders for now, with their production design in ARCHITECTURE.md. From
prompt to production. Thanks."

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
