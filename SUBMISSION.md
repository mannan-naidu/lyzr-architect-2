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
| Video walkthrough (Loom) | https://www.loom.com/share/2b6f632aba244c0b9f9e66a5f128593c |
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
| **AI app builders** | Lovable, Replit, Bolt, v0, Emergent | Anyone, in the browser, by prompting | A whole hosted app; AI features and simple agents (Lovable's AI gateway, Replit's Agents & Automations) that live inside their platform | Their cloud, one click |
| **AI coding tools** | Cursor, Trae, Windsurf, Claude Code, Codex, Copilot | Developers, in their own repo | Code changes inside an IDE or terminal | Your machine; you own build, deploy and infra |
| **Agent builders** | Lyzr Studio, n8n, Relevance AI, OpenAI AgentKit | Ops and technical teams | Agents and workflows, not a full app | The vendor's runtime |
| **Architect 2.0** | — | Business users, with developers in Pro mode | An **agentic app**: a UI plus agents, ready for production | Lyzr runtime by default; exportable |

**Our position:** *the app builder for production AI apps*. Architect builds apps that get found
(SEO + GEO), that remember (Cognis), and whose agents run on Lyzr or any framework, backed by an
enterprise agent company. App builders are app-first, and their agents are tied to their own
platform. Coding tools assume you're a developer. Agent builders don't build the app around the
agents. Architect covers all three.

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
| Describe your architecture (.md file) | Upload [`ARCHITECTURE.md`](ARCHITECTURE.md). It covers every topic the form names: key decisions §1.1, sandboxing §6, agent harness §5, proxies §10, model-agnosticism §7–8, GitHub §11, deployment §12, scaling §13 |

### Why would a non-technical user pick your platform? (vs Replit, Lovable, Emergent)

App builders are a crowded space, and the big ones like Lovable and Replit are great at getting
you to a demo that runs. The hard part comes after that: getting people to actually find what you
built, not having to re-explain yourself every time, and adding AI that does something useful.
Some of them can add AI features or simple agents now, but those agents live inside their
platform. Architect treats agents as a core part of the plan, lets each one remember its users, and
runs them on Lyzr's enterprise agent platform, or exports them to LangGraph, CrewAI or the OpenAI
SDK. It's built for the space between app builders and agent platforms.

When you start a project, you tick one box if it's a public website, and Architect builds it so
Google and AI assistants like ChatGPT and Perplexity can read it and quote it. You don't need to
know anything about SEO. You can edit pages and FAQs yourself in a simple content editor, or pull
them in from WordPress.

It also remembers you: your style, where you deploy, the decisions you've already made. It
carries them into your next project, and you can see, edit or delete anything it remembers. So
your tenth app takes a sentence, not a page.

If your app needs AI, like a support assistant or a lead scorer, Architect adds the agents for
you and suggests the apps they should connect to, like Gmail or Slack. If it doesn't, you choose
"no AI agents" and just get a regular website or app.

When something breaks, it works out why before trying a fix, never repeats a fix that already
failed, and after three tries it rolls back and asks you one simple question instead of burning
your credits. Its own fixes aren't charged to you.

You also never have to hunt for a feature. Press ⌘K and type what you want in your own words,
like "undo" or "how much am I paying", and it takes you straight there. Today it matches the words
you type; the production version uses semantic search, so it understands what you mean even when
you don't know the feature's name.

None of this means learning something new. It's the same describe, plan, preview, ship flow you
know from Lovable or Replit, with a short tour on day one, and you can try it as a guest without
signing up.

### Why would a technical user pick your platform? (vs Claude Code, Codex, Cursor)

I wouldn't pitch Architect as a better code editor than Claude Code, Cursor or Codex. They're
excellent at working inside a repo you already own, and in a market this crowded nobody wins on
"best code generator", because everyone uses the same models. Architect is for the layer around the
code that those tools leave to you: a business user can start the app, and you get portable agents,
memory and the code underneath, in one project. App builders like Lovable and Replit can add
agents too now, but those agents are tied to their platform; here each agent is one spec you can take anywhere.

First, agents. You describe an agent once and Architect compiles it to Lyzr, LangGraph, CrewAI,
the OpenAI Agents SDK or plain TypeScript, all behind the same API, so switching frameworks isn't a
rewrite. Today's architect.new builds only Lyzr agents; I don't know Lyzr's exact reason, but I
assume it's a business one (revenue on its runtime, guardrails it can guarantee), so Lyzr stays the
default and the other frameworks are an export.

Second, memory as infrastructure. Instead of a CLAUDE.md or .cursorrules file you maintain by hand
for each repo, Architect runs Lyzr's open-source Cognis, self-hosted on AWS: hybrid vector and
keyword search, versioned facts, scoped to you across every project. Every reply shows which
memories it used, and you can edit or delete them.

Third, a fix loop you can trust. Errors are fingerprinted by message and location, and past fixes
are only hints: the model has to diagnose the cause before reusing one. A loop breaker rolls back
after three failed attempts, across sessions, not just within one.

Fourth, production defaults: static-first builds with JSON-LD, a sitemap and llms.txt for SEO and
GEO, a security check before deploy, and the code pushed to your own GitHub repo. Pro mode gives
you diffs, edit-by-hand, logs, a run trace and a ledger of every token.

Small things add up too: a project switcher, a connectors catalogue for the tools agents use, and
⌘K feature search. Search matches words today, and the production design moves it to semantic
search on the same vector + keyword engine that powers memory, so "where did my money go" finds the
billing ledger.

It's model-agnostic (Anthropic, OpenAI, Google, Groq, OpenRouter), and the design includes an MCP
bridge so you can drive the same project from your editor, so Architect sits next to Claude Code,
not instead of it. To be upfront: sign-in, the database, chat, planning and building, the live
preview, SEO + GEO files, the content editor, Cognis memory and GitHub push are live; agent runs,
hosting and most connectors are placeholders, with their production design in ARCHITECTURE.md.
There's a 5-minute walkthrough here: https://www.loom.com/share/2b6f632aba244c0b9f9e66a5f128593c
