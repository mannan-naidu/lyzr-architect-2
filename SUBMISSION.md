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

Most AI app builders are great at getting you to a demo that runs. The hard part comes after
that: getting people to actually find what you built, not having to re-explain yourself every
time, and adding AI that does something useful. That's the gap I built Architect 2.0 for.

When you start a project, you tick one box if it's a public website, and Architect builds it so
Google and AI assistants like ChatGPT and Perplexity can read it and quote it. You don't need to
know anything about SEO. You can edit pages and FAQs yourself in a simple content editor, or pull
them in from WordPress.

It also remembers you: your style, where you deploy, the decisions you've already made. It
carries them into your next project, and you can see, edit or delete anything it remembers. So
your tenth app takes a sentence, not a page.

If your app needs AI, like a support assistant or a lead scorer, Architect adds the agents for
you. If it doesn't, you just get a regular app.

And when something breaks, it works out why before trying a fix, never repeats a fix that already
failed, and after three tries it rolls back and asks you one simple question instead of burning
your credits. Its own fixes aren't charged to you.

None of this means learning something new. It's the same describe, plan, preview, ship flow you
know from Lovable or Replit, with a short tour on day one.

### Why would a technical user pick your platform? (vs Claude Code, Codex, Cursor)

I wouldn't pitch Architect as a better code editor than Claude Code, Cursor or Codex. They're
excellent at working inside a repo you already own. Architect is for the layer around the code
that those tools leave to you.

First, agents. You describe an agent once and Architect compiles it to Lyzr, LangGraph, CrewAI,
the OpenAI Agents SDK or plain TypeScript, all behind the same API, so switching frameworks isn't
a rewrite.

Second, memory as infrastructure. Instead of a CLAUDE.md or .cursorrules file you maintain by hand
for each repo, Architect runs Lyzr's open-source Cognis on AWS: hybrid vector and keyword search,
versioned facts, scoped to you across every project. Every reply shows which memories it used, and
you can edit or delete them.

Third, a fix loop you can trust. Errors are fingerprinted by message and location, and past fixes
are only hints: the model has to diagnose the cause before reusing one. A loop breaker rolls back
after three failed attempts, across sessions, not just within one.

Fourth, production defaults: static-first builds with JSON-LD, a sitemap and llms.txt for SEO and
GEO, a security check before deploy, and the code pushed to your own GitHub repo. Pro mode gives
you diffs, logs, a run trace and a ledger of every token.

It's model-agnostic too (Anthropic, OpenAI, Google, Groq, OpenRouter). The way I see it,
Architect sits next to Claude Code, not instead of it. The design includes an MCP bridge so you
can drive the same project from your editor.

### Any other comments? (optional)

A bit about how I approached this. Lyzr builds production agents inside its clients'
environments, Agent Studio lets teams build their own, and Architect is the front door that turns
an idea into a working app on top of that. So I treated it as a product question first: who is
this for, and why would they pick it in a market where Lovable, Replit, Cursor and the model
companies are all shipping builders?

My answer is the intersection. App builders give you an app without real agents, agent platforms
give you agents without an app, and coding tools assume you're a developer. Architect 2.0 tries
to be all three in one project, with three things that close the gap between a prototype and
production: getting found (SEO + GEO), memory (Lyzr's own Cognis, self-hosted on AWS), and agents
in any framework.

One thing I couldn't find an answer to is why Architect currently builds only Lyzr agents. I'm
assuming it's a business decision (revenue on the runtime, guardrails Lyzr can guarantee, focus),
so I kept Lyzr as the default and made the other frameworks an export.

To be upfront about what's live: sign-in, the database, multi-model chat, planning and building,
the live preview, SEO + GEO files, the content editor, Cognis memory and GitHub push all work.
Agent runs, hosting of user apps and most connectors are placeholders for now, and ARCHITECTURE.md
describes how each would work in production.

---

## Loom script (about 5 minutes)

### Before you record (10 minutes)

1. **Memory prep.** Sign in at https://lyzr-architect-2o.vercel.app with **GitHub**, create any
   quick project, and say in chat: *"I always want a dark theme and a minimal, clean style."*
   Wait a minute, then sign out. Memory now has something to recall on camera.
2. **Guest tab.** Open your small guest project on **Preview**, with the **Demo mode** badge
   visible.
3. **Second tab.** `docs/architecture/architecture.png`.
4. **Settings.** Model: Groq GPT-OSS 120B (fastest). Browser zoom 110–125%, other tabs closed,
   Do Not Disturb on. Loom: Screen + Camera, **Window** mode, camera bubble bottom-right.
5. **Pick your break.** Decide which line you'll break for the fix demo (e.g. delete a closing `}`).

### Part 1: guest mode (0:00–1:20)

| Time | On screen | Say |
| --- | --- | --- |
| 0:00 | Guest project, Preview tab | "Hi, I'm Mannan. This is Architect 2.0: from prompt to production. It builds AI apps that get found, remember, and run any agent. What you're seeing is guest mode, so no account: this is a real project Architect built." |
| 0:15 | Point to the Demo mode badge. Click Plan → Preview → Code. ⌘K → "Take the quick tour" (let two steps play) | "Anyone can try it without signing up. The flow is the one you already know from other tools: describe, plan, preview, ship. And there's a short tour on day one." |
| 0:35 | Stay on the project | "Quick context on how I see Lyzr. Lyzr builds production agents inside its clients' environments, Agent Studio lets teams build their own, and Architect is the front door that turns an idea into a working app. Today Architect only builds Lyzr agents. I don't know the exact reason, but it's a business decision, so I kept Lyzr as the default and made other frameworks an export." |
| 1:00 | Stay on the project | "This is a crowded space. Lovable and Replit give you an app without real agents, agent platforms give you agents without the app, and Cursor or Claude Code assume you're a developer. Architect sits where those three meet. Let me sign in and show you." |

**Pause Loom** → account menu → Sign in with GitHub → **Resume**.

### Part 2: signed in (1:20–5:00)

| Time | On screen | Say |
| --- | --- | --- |
| 1:20 | Dashboard → click the **Yoga studio site** starter → the form opens pre-filled with SEO + GEO and Content mode ticked → Create project | "With an account everything's saved, and Architect remembers me across projects. Starters fill everything in. SEO and GEO is switched on at the start, because it changes how the app gets built." |
| 1:40 | Plan tab → Generate the plan → point to "What I remembered", the agents, the open question → click one answer → Approve & build | "It plans before it builds. Here it's using what it remembered from my last project. It only adds an agent because this site needs one to answer class questions. When something's unclear, it asks one question with one-click answers." |
| 2:15 | Build checklist streams → preview appears | "The UI streams in file by file, and the preview is live." |
| 2:30 | Pro → Code → Edit by hand: break a line → Fix it → read the toast → Memory → Billing ledger | "Now let me break something. It diagnoses the cause first. A past fix is only a hint, it's reused only if the cause matches, and fixes that failed are never repeated. After three tries it rolls back and asks me. And its own fixes aren't billed to me; the ledger shows that." |
| 3:05 | Memory tab: edit one memory. Agents tab: Compile to Lyzr → LangGraph → CrewAI | "Memory isn't a black box: I can see, edit or delete anything. And one agent spec compiles to Lyzr, LangGraph, CrewAI or the OpenAI SDK, so choosing a framework is never a rewrite." |
| 3:35 | Click **Connectors** → show the list and "Suggested by your plan" → close. Click the project name → show the project switcher | "Connectors are where agents get their tools: Slack, Gmail, Drive, HubSpot. GitHub and WordPress are live; the rest are a preview of the design. And I can switch projects from the top bar." |
| 3:55 | ⌘K → type "how much am I paying" → Enter | "Feature search takes you straight to any feature. architect.new doesn't have one." |
| 4:05 | Ship → Deploy → SEO + GEO report → Content tab: edit an FAQ → Push to GitHub → open the repo | "Ship runs a security check and deploys a pre-rendered page with meta tags, structured data and llms.txt, so it's found on Google and quoted by AI assistants. FAQs from the content editor feed into that. And the code goes to my own GitHub repo." |
| 4:35 | Architecture diagram tab | "Under the hood: the app is on Vercel, data on Supabase with row-level security, and memory runs on Lyzr Cognis in Docker on AWS, because it needs a long-running server. Agent runs and hosting are placeholders for now, with the production design in ARCHITECTURE.md. From prompt to production. Thanks for watching." |

### After recording

- Trim the start and end; cut waits during plan, build and fix down to 2–3 seconds.
- Chapters: Hook · Guest mode · Lyzr · Positioning · Plan · Build · Fix memory · Memory & agents ·
  Connectors · Search · Ship · Architecture.
- Captions on. Title: **"Architect 2.0: from prompt to production"**.
- Share → Anyone with the link → test it in a private window → paste the link in "Any other
  comments?".

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
