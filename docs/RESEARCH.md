# Market research: what users hate, and what Architect 2.0 should do about it

Researched 2026-10-04 (web search across Reddit-sourced press, Medium, Substack, dev.to, Vercel
community, Trustpilot/G2/Capterra, GitHub and Lyzr docs). Sources are listed at the end of each
section.

---

## 1. Competitive landscape for *this assignment*

At least **11 other candidates** have public repos for the same brief. Most of them converge on
the same idea:

| Repo | Pitch | Notable ideas |
| --- | --- | --- |
| Tirush04/architect-2 | "One project, **two lenses**, agents first-class" (Guided/Pro) | Blueprint + wireframes before build, click-to-edit preview, agent canvas, 6-framework codegen, real deploy URLs, command palette |
| HeyImAnuj/architect-2 | "Dual-lane" (Soft/Pro lane) | Flow-first canvas, 6 frameworks, GitHub push, public `/a/…` links |
| shriyashish-mishra/architect-2.0 | Vibe mode / Pro mode, "one project, two doors" | Supabase auth + RLS, GitHub import, "blueprint" dark aesthetic; trace/preview simulated |
| Apurv428/lyzr-architect-2.0 | Guided ⇄ Pro, "skill is a dial, not a user type" | Plan approval, Monaco diffs, evals, Autopilot, checkpoints, MCP, Sandpack + WebContainer, prompt caching |
| ritikadas98/architect-2.0 | "Asks before it assumes" | Confirms what it read from screenshots, `design.md`, **pre-launch security scan**, **free fixes for agent-caused bugs** |
| NirmalyaRakshit, MeShreyash, Aditya2github, akhilmankala26, shivamATpaytm, shambhu-10 | Dual-mode workspaces | Progressive disclosure, file tree, terminal, git tabs |

**Implications:**
- **"Two modes, one project" is now table stakes, not a differentiator.** Every serious submission
  has it, and one uses our exact phrase ("two lenses").
- Plan-before-build, click-to-edit, framework codegen, security scanning and free fixes have also
  been done.
- **No candidate we found leads with memory.** That's still our open lane, so it must be the
  headline, made concrete, and deeply integrated rather than a side panel.

Sources: [Tirush04](https://github.com/Tirush04/architect-2) ·
[HeyImAnuj](https://github.com/HeyImAnuj/architect-2) ·
[shriyashish-mishra](https://github.com/shriyashish-mishra/architect-2.0) ·
[Apurv428](https://github.com/Apurv428/lyzr-architect-2.0) ·
[ritikadas98](https://github.com/ritikadas98/architect-2.0) ·
[NirmalyaRakshit](https://github.com/NirmalyaRakshit/lyzr-architect-2.0) ·
[MeShreyash](https://github.com/MeShreyash/architect-2-workspace)

---

## 2. What users are unhappy with (ranked by how often it comes up)

### 2.1 Paying for the AI's own mistakes (the #1 complaint, on every platform)
- **Replit:** effort-based pricing with Agent 3 (Sept 2025) led to reports like "blew through $70 in
  a night" and "$1K in a week". Failed attempts and unrequested refactors are all billed.
- **v0:** usage pricing since May 2025, with users reporting $10–30 a day. "A $30 recharge vanished
  within 2 days." A power user spent $140 on 1,500 prompts, "largely retrying its own errors".
- **Cursor:** the June 2025 change from 500 requests to a $20 credit pool cut effective requests to
  about 225, with surprise overages. Agent planning and caching tokens are invisible to the user.
- **Emergent:** Trustpilot about 2.7/5. "Unpredictable credit consumption, frequent AI debugging
  loops that drain budgets."
- **Bolt:** the free tier was burned debugging one feature; it was the only tool in an XDA test
  that never produced a working app.
- **Lyzr itself (G2):** "the credit-based pricing model can be a bit confusing … may end up being
  expensive."

### 2.2 The "doom loop": it forgets what it already tried
- The agent makes a mistake, the user corrects it, and *the next session starts fresh and makes
  the same mistake again*. "Each session starts with zero memory of previous corrections … no
  access to the team's decisions, deprecated patterns, or past fixes."
- It also degrades within a session: "works beautifully for 30 minutes, then collapses", and after
  20–30 messages it "loses track of what was discussed early on" ("like Memento").
- Community advice: stop after 3 failed fixes, roll back, write down the cause, and plan before
  coding.

### 2.3 Security left to chance
- **CVE-2025-48757 (Lovable, CVSS 9.3):** generated Supabase schemas shipped **without RLS**, so 303
  endpoints across 170+ apps leaked emails, payment data and admin credentials. The anon key in the
  page plus RLS off means anyone can read or write the database.
- Five recurring failure patterns: exposed secrets, no real backend, weak auth, "display-shaped"
  data, and no tests or error handling.

### 2.4 The 70% problem and the hand-off
- These tools get you about 70% of the way, and "the last 30% kills you": payments, auth edge cases,
  slow queries and awkward APIs.
- For non-technical users there's knowledge lock-in: "Founders know what the app does but not why
  the code is structured the way it is." Fixing anything later needs the tool, and credits, again.

### 2.5 Lock-in and ownership
- Exported code is often coupled to the platform's runtime, components or auth. The real test is
  whether it *runs* elsewhere, not whether you can download it.

### 2.6 Destructive agents and trust
- **Replit (July 2025):** the agent deleted a production database during a code freeze. Replit's
  fix was dev/prod database separation plus one-click restore.

### 2.7 Agent builders specifically (n8n, Langflow, Flowise, Lyzr Studio)
- Debugging nested flows is hard and errors are generic. There's little observability.
- There's a "low-code ceiling": the common path is a proof-of-concept in a visual builder, then a
  rewrite in code (LangGraph and the like) for production.
- **Lyzr G2 cons:** documentation gaps, a learning curve, setup feels heavy for small teams,
  limited tools and no custom tools (*older reviews; MCP and custom tools now exist*).

Sources:
[The Register: Replit pricing](https://www.theregister.com/2025/09/18/replit_agent3_pricing/) ·
[InfoWorld: Replit](https://www.infoworld.com/article/4059876/replit-update-sparks-developers-dissatisfaction-over-pricing.html) ·
[Fortune: Replit DB wipe](https://dc.fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure) ·
[Vercel community: v0 pricing](https://community.vercel.com/t/v0s-new-pricing-is-horrible-30-recharge-vanished-within-2-days/11943) ·
[Vercel community: repeated errors](https://community.vercel.com/t/repeated-errors-and-wasted-credits-on-vercel-v0/12582) ·
[Cursor pricing timeline](https://www.wearefounders.uk/cursors-pricing-disaster-the-full-timeline-of-how-an-ai-coding-darling-burned-its-most-loyal-users/) ·
[Cursor on Reddit](https://www.aitooldiscovery.com/guides/cursor-reddit) ·
[Emergent review](https://www.eesel.ai/blog/emergent-ai-reviews) ·
[XDA: Bolt vs v0 vs Lovable](https://www.xda-developers.com/tried-vibe-coding-a-real-app-in-bolt-v0-and-lovable/) ·
[AI agent doom loop](https://getunblocked.com/blog/ai-agent-doom-loop/) ·
[Doom loop (HackerNoon)](https://hackernoon.com/the-ai-doom-loop-why-your-autonomous-coding-agent-is-making-things-worse-and-how-to-fix-it) ·
[Why vibe coding breaks after 30 messages](https://artmnk.substack.com/p/how-to-vibe-code-as-a-professional) ·
[CVE-2025-48757](https://www.bleek.dev/cve-2025-48757) ·
[70% problem](https://justtalkingtech.medium.com/vibe-coding-in-2026-i-tried-cursor-replit-bolt-lovable-and-v0-heres-what-actually-ships-11d0b70cf1d5) ·
[Lock-in](https://getcreatr.com/ai-app-builder-vendor-lock-in) ·
[Visual agent builders compared](https://blckalpaca.at/en/knowledge-base/ai-agents/ai-agent-frameworks-comparison/langflow-vs-flowise-vs-n8n) ·
[Lyzr on G2](https://g2.com/products/lyzr-lyzr-ai/reviews)

---

## 3. Memory: what exists today

| Product | Memory today | Gap |
| --- | --- | --- |
| **Lyzr Studio agents** | **Cognis** (default): short-term (session), long-term (user facts across sessions, 13 categories), session memory scoped by `owner_id + agent_id + session_id`, with auto ADD/UPDATE/DELETE dedup. Alternatives: "Lyzr Memory" or AWS Bedrock AgentCore. Configured with a toggle and a settings modal. | It's memory for the *agents you build*. The docs don't mention any end-user UI to view, edit or delete memories. |
| **Cognis (open source)** | MIT, `pip install lyzr-cognis`. SQLite + local Qdrant, hybrid BM25/vector search under 300 ms, #1 on LongMemEval SS-User. API: add, get, search, delete, get_context, clear. The hosted version adds update, summaries and async. | **Python only.** The hosted version is the Python `lyzr-adk` over a REST backend. |
| **architect.new (the builder)** | The PRD is rewritten on every iteration (v2.2), acting as project memory. GitAgent (beta) keeps `memory/` as git files. | No **cross-project, per-user builder memory**. Nothing remembers "how *you* build" or "what fixed this last time". |
| Cursor / Claude Code | Rules and memory files (`.cursor/rules`, `CLAUDE.md`), human-editable and project-scoped | Manual, per project, developer-only |
| Windsurf | Auto-generated "Cascade memories", workspace-scoped | Hidden-ish, per workspace |
| Lovable / Replit | Project knowledge file / `replit.md` | Per project, manual |

**Takeaway:** coding tools remember *per project*, and Lyzr remembers *for the agents you build*.
**No one gives the builder a cross-project memory of the user** that is visible, editable and
used to stop repeat mistakes. That's our lane.

Sources: [Lyzr memory docs](https://docs.lyzr.ai/agent-lab/agent%20features/memory) ·
[Cognis](https://www.lyzr.ai/cognis/) · [Cognis hosted vs OSS](https://docs.lyzr.ai/cognis/comparison) ·
[Persistent memory survey](https://dev.to/crabtalk/how-ai-agents-remember-a-survey-of-persistent-memory-3m3f) ·
[Windsurf memories](https://memnexus.ai/blog/2026-02-20-windsurf-persistent-memory) ·
[architect.new v2.2 changelog](https://docs.architect.new/changelog/v2-2-0.md) ·
[GitAgent](https://docs.architect.new/build/git-agents.md)

---

## 4. Recommendations: sharpen the thesis

**Old pitch:** "One project, two lenses, and Architect remembers." The first half is now commodity.

**Proposed pitch:** **"Architect remembers, so you never pay for the same mistake twice."**

Memory becomes the engine behind fixes to the top three complaints, not a side panel:

| User pain (from §2) | Feature, powered by memory | Real or simulated in the prototype |
| --- | --- | --- |
| 2.2 Doom loop, repeating mistakes | **Fix memory.** Every error→fix pair is stored. Before attempting a fix, the harness recalls "tried X, failed; Y worked on 12 Sep". A **loop breaker** stops after 3 failed attempts, rolls back to the last good checkpoint, and asks one clarifying question. | Real (Memori + harness) |
| 2.1 Paying for its mistakes | **Fair-billing ledger.** Each step is tagged *you asked* vs *agent self-fix*, and self-fixes are free. A **cost preview** runs before each build ("~12k tokens, about $0.04"), with a per-task budget cap. Memory lowers cost because answers are pre-filled. | Real token metering; billing simulated |
| 2.2 Context loss after 30 messages | **Project brief + decision log.** A running, memory-backed list of decisions ("Auth: Supabase. Style: Tailwind, dense dashboard. Never use localStorage for tokens.") is injected every turn and editable in the Memory panel. | Real |
| 2.3 Security | **Secure-by-default memory.** RLS is always on (we already do this). A pre-deploy security check scans for exposed keys, tables without RLS and secrets in client code, and the user's security decisions are remembered across projects. | Partial (static checks real) |
| 2.4 70% problem, hand-off | **Pro lens + "explain why".** Each decision in the log links to the diff that implemented it, so a developer who inherits the project sees *why*. | Real (log) / partial (diff links) |
| Lyzr-specific | **Agent memory as a toggle** on every generated agent, modelled on Lyzr's three-tier model (short-term, long-term, session), so it maps 1:1 onto Lyzr Cognis when deployed on Lyzr | Real config; runtime simulated |
| Trust | **Memory panel:** every fact with its source message, date, scope (you / project / agent), and edit, delete, "forget this project" and export controls. "Why did you do that?" shows the memories used for a given step. | Real |

**Strategic option: build on Lyzr Cognis instead of Memori.**
- *For:* it's Lyzr's own product (shows homework and fit), the API already has list, search and
  delete for the Memory panel, it ranks top on LongMemEval, and it's MIT-licensed.
- *Against:* it's Python only, so it needs a small Python sidecar service (FastAPI on Fly or
  Railway) or the hosted Lyzr API with an `LYZR_API_KEY`. Memori is already working in TypeScript
  in our stack.
- *Middle path:* keep Memori for the prototype and describe a pluggable memory interface in
  ARCHITECTURE.md, with Cognis as the production provider for Lyzr. Decision pending (it changes
  the fixed stack).

**Out-of-the-box ideas worth a small slot:**
- **"Last 30%" production checklist** before deploy: auth edge cases, rate limits, error states,
  secrets, RLS.
- **Dev/prod data separation** and one-click restore (the lesson from Replit's database wipe).
- **Portable by design:** "Runs without Architect" badge, standard Next.js + Supabase output,
  export that actually runs.
