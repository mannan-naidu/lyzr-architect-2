# Manual exploration roadmap

A hands-on checklist for exploring the platforms yourself (in your own browser) before we design
each flow. The brief explicitly asks you to "understand every feature of each one… the UI, the UX,
the user flows."

**How to use it:**
- Use one throwaway prompt everywhere so results are comparable:
  > *"Build a customer-support agent app: users upload our FAQ PDF, ask questions in a chat, and
  > the agent escalates unresolved questions by email. Include a small admin dashboard of
  > escalations."*
- Screenshot each step into `docs/exploration/<platform>/` (or a Google Doc) and note the
  **time**, **credits spent**, and **what confused or annoyed you**.
- Total time is about 4–5 hours. Do **architect.new first and most thoroughly**, since it's what
  we're replacing.

---

## Phase 1: architect.new (about 90 minutes, must do)

| # | Explore | What to note (this feeds our design) |
| - | --- | --- |
| 1 | Sign-up/login (email, Google, SSO), onboarding, the **AI Consultant** (role → bottlenecks → stack → suggested apps) | Steps to first value; what it asks; does it remember any of it later? |
| 2 | Homepage **+** menu: attach a PDF/CSV, pick a theme, Prompt Library, "Add studio agents" | Where context goes in; how discoverable each option is |
| 3 | Submit the test prompt, then go through **Planning mode**: guided questions → PRD → **app mockup**, workflow diagram, skill files → "Start Building" | How good the questions are; can you edit the PRD; time and credits used |
| 4 | Build phases **Plan → Agents → App**; open an agent ("Edit in Studio") | How agents, tools and knowledge bases are shown; how the jump to Lyzr Studio feels |
| 5 | **Live preview** while it builds: what you see during "UI getting built", progress indicators, errors | This is a named brief item; capture what's reassuring vs anxious |
| 6 | Chat iteration: Plan toggle vs Build, the **Test** toggle (testing agent), deliberately cause a bug ("make the button call a non-existent API") | **Does it repeat failed fixes? How many credits did fixing cost?** (our core thesis) |
| 7 | Tabs: **Database**, Artifacts, Agents, code view (is there a file tree? diffs?) | What a developer can't see or do (our Pro gaps) |
| 8 | **GitHub**: connect, auto-commit, pull/push, branch switch; **Import** a small Next.js repo or zip | Scopes requested, failure states, the import "porting" message |
| 9 | **Deploy**: modal (subdomain rename, custom domain, analytics, marketplace), then open the live URL | Deploy time, logs shown or hidden, rollback? |
| 10 | Env vars, Usage (per-agent credit breakdown), Plans & Credits, Marketplace (clone an app), sharing, org/members | Is cost predictable? What does the usage screen tell you? |
| 11 | Start a **second project** with a similar prompt | **Does it remember anything from project 1?** (it shouldn't, which is our opening) |

## Phase 2: Lyzr Studio (about 30 minutes)

| # | Explore | Note |
| - | --- | --- |
| 1 | studio.lyzr.ai: create an agent, then the **Memory** toggle and settings modal (Cognis / Lyzr Memory / Bedrock) | Can the end user **see or delete** memories? (if not, that's our "visible memory" point) |
| 2 | Tools, knowledge base, MCP, Responsible AI/guardrails, agent playground, API/deploy | What Architect hides from Studio users, and what devs need |

## Phase 3: Competitors (about 20–25 minutes each, same prompt)

| Platform | Focus on | Signature thing to study |
| --- | --- | --- |
| **Lovable** | Plan mode, Supabase integration, Security scan, GitHub sync, Visual edits (click-to-edit) | How it warns about RLS after CVE-2025-48757; knowledge file |
| **Bolt.new** | WebContainer preview speed, token meter, "fix" loops | How visible token spend is |
| **v0** | UI quality, design mode, Vercel deploy, credits meter | Polish of generated UI; cost per fix |
| **Replit** | Agent effort/checkpoints, rollback, dev/prod DB split, deploy | Checkpoint and rollback UX; billing transparency |
| **Emergent** | Multi-agent build (architect/designer/dev/test), mobile apps | How agent roles are surfaced to the user |
| **Rocket.new** | Templates, Figma import, flows | Onboarding and templates |
| **Cursor** (desktop) | Agent mode, diffs and accept/reject, rules/memories, checkpoints | **Diff review UX** for our Pro lens; how memory is shown |
| **Claude Code / Codex** | CLAUDE.md memory, plan mode, permissions, subagents | Developer trust patterns: approvals, plan-then-act |
| *Optional:* Windsurf, TARS, n8n/Flowise | Cascade memories; no-code agent builder; visual flows | Memory UX; agent graph UX |

## Phase 4: Synthesize (about 30 minutes)

Fill in this table (keep it in `docs/exploration/matrix.md`) and share it with me. It directly
shapes our design decisions and the "unique first" ordering.

| Capability | architect.new | Lovable | Bolt | v0 | Replit | Emergent | Cursor | **Ours** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Remembers you across projects | | | | | | | | ✅ |
| Shows what it remembers / why | | | | | | | | ✅ |
| Avoids repeating a failed fix | | | | | | | | ✅ |
| Doesn't bill for its own errors | | | | | | | | ✅ |
| Cost preview before a build | | | | | | | | ✅ |
| SEO/GEO for public pages | | | | | | | | ✅ |
| Plan before build | | | | | | | | ✅ |
| Diff review / file tree | | | | | | | | ✅ (Pro) |
| Choose framework / model | | | | | | | | ✅ |
| Import an existing repo | | | | | | | | ✅ |
| Rollback / checkpoints | | | | | | | | ✅ |

**Three questions to answer at the end:**
1. Where did *you* feel the most friction or anxiety, as a non-technical user and as a developer?
2. Which single moment felt magical, and how do we beat it?
3. What would make you trust the platform with real money and real data?
