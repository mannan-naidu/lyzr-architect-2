# Decision log (ADRs)

Lightweight Architecture Decision Records. Newest last. Each entry: context → decision →
consequences. Superseded decisions stay in the log, marked as such.

---

## ADR-001 — Vercel over AWS for the prototype

- **Date:** 2026-09-29
- **Status:** Accepted

**Context.** The deliverable is a prototype graded mainly on architecture and UX, built in ~4-hour
blocks by one person. We need preview URLs per branch, zero-ops hosting and first-class Next.js
support.

**Decision.** Host the platform on Vercel: `main` auto-deploys to production, every branch gets a
preview URL.

**Consequences.**
- ✅ Zero infra to manage; streaming responses, route handlers and `proxy.ts` work out of the box.
- ✅ Preview URLs make review of each session's PR trivial.
- ⚠️ Serverless limits (function duration, bundle size, no long-lived processes). Long agent runs
  and real sandboxes would move to a worker tier (e.g. AWS ECS/Fargate or E2B) at scale — this is
  covered in ARCHITECTURE.md → Scaling.
- ⚠️ Native modules (Memori's Rust engine + ONNX embeddings) must fit Vercel's function size limit —
  see ADR-003.

---

## ADR-002 — Supabase for auth + Postgres

- **Date:** 2026-09-29
- **Status:** Accepted

**Context.** We need GitHub OAuth (later: push to repos), a relational store for projects,
messages, files and deployments, and per-user isolation, with minimal backend code.

**Decision.** Supabase Auth (GitHub provider) + Supabase Postgres. Schema lives in
`supabase/migrations/`. Every table has RLS with owner-only policies, and the app talks to the DB
with the user's session so **RLS is the security boundary**. A trigger creates the `profiles` row on
sign-up.

**Consequences.**
- ✅ One vendor for auth + DB; `@supabase/ssr` handles cookie sessions in Next.js.
- ✅ Memori can share the same Postgres (own schema) — one database to operate.
- ⚠️ **GitHub `repo` scope is broad** (read/write to all the user's repos, including private). Asking
  for it at login may put users off. Plan: log in with minimal scopes and request `repo` only when
  the user first pushes (incremental consent), or use a GitHub App with per-repo installs.
- ⚠️ **Supabase does not store or refresh the GitHub `provider_token`.** It is only present on the
  session right after the OAuth callback. For GitHub push (Session 5) we must capture it in
  `/auth/callback` and store it encrypted server-side (or re-auth on demand).

---

## ADR-003 — Memori for persistent memory

- **Date:** 2026-09-29
- **Status:** Accepted (approach refined by the spike — see `docs/memori-spike.md`)

**Context.** The product angle is "Architect remembers": the builder agent should recall each
user's decisions, preferences and past fixes across sessions, and users must be able to see, edit
and delete what is stored.

**Decision.** Use Memori (`@memorilabs/memori`, Apache-2.0) in BYODB mode on our Supabase
Postgres, in a dedicated `memori` schema. Attribution: `entity = user id`, `process = project id`.
Memori Cloud (`MEMORI_API_KEY`) is the fallback if BYODB can't run in our serverless environment.

**Consequences.**
- ✅ Memories live in our own database → the Memory panel can list/edit/delete rows directly, and
  deleting a user cascades cleanly.
- ✅ SQL-visible storage fits the "transparent memory" UX.
- ⚠️ Memori's **fact extraction ("Advanced Augmentation") still calls Memori's hosted API** even in
  BYODB mode (conversation text is sent; entity/process IDs are hashed). This needs a privacy note
  in the UI and is rate-limited without a key.
- ⚠️ BYODB runs a native Rust engine and downloads an ONNX embedding model (all-MiniLM-L6-v2) from
  Hugging Face on first use — cold starts and Vercel function size need checking.
- ⚠️ Local recall is scoped by **entity only**, not by process, so project-level isolation of
  memories must be handled by us (filter or prompt design).
- ⚠️ Memori intercepts the raw provider SDKs (Anthropic, OpenAI, Google), **not the Vercel AI SDK**.
  We'll call `recall()` manually and inject context ourselves in the AI SDK pipeline.

---

## ADR-004 — Memori behind a pluggable MemoryProvider; Cognis named for production

- **Date:** 2026-10-04
- **Status:** Accepted

**Context.** Lyzr ships its own memory layer, Cognis (MIT open source + hosted). It's
benchmark-leading, has full CRUD and is native to Lyzr Studio agents, but it's Python-only. Memori
has a TypeScript SDK, runs on our own Supabase Postgres, and is verified end to end in our spike.

**Decision.** Use Memori in the prototype. Define a `MemoryProvider` interface (`recall`, `save`,
`list`, `update`, `delete`, `forgetScope`) so the harness and the Memory panel never depend on
Memori directly. Name Lyzr Cognis (via a Python sidecar or the hosted Lyzr API) as the production
provider when Architect runs inside the Lyzr ecosystem.

**Consequences.**
- ✅ No new runtime (Python) in the prototype; memory lives next to our data.
- ✅ The architecture shows awareness of and a path to Lyzr's own product.
- ⚠️ The Memory panel's list/edit/delete goes through SQL on the `memori_*` tables for Memori;
  Cognis would use its API instead.

---

## ADR-005 — Product thesis: "Architect remembers, so you never pay for the same mistake twice"

- **Date:** 2026-10-04
- **Status:** Accepted (evolves with owner input; see PLAN.md §10)

**Context.** Research (RESEARCH.md): the top complaint across vibe-coding tools is paying for the
AI's own mistakes and doom loops; 11+ rival submissions already lead with "two modes, one project".

**Decision.** Lead with memory-powered features (fix memory and loop breaker, fair-billing ledger,
builder memory and decision log, visible memory, agent memory toggle, SEO/GEO toggle). The Simple/Pro
lenses and other shared features are presented last.

---

## ADR-006: Builder memory on Lyzr Cognis, as a Docker service on AWS

- **Date:** 2026-10-06
- **Status:** Accepted (supersedes ADR-003; refines ADR-004)

**Context.**
- On the live Vercel deployment, Memori's prebuilt native engine failed to load with
  `undefined symbol: __isoc23_strtoll`. It's linked against glibc 2.38+, while Vercel's function
  runtime (Amazon Linux 2023) has glibc 2.34, and no configuration can fix that.
- Lyzr's own memory engine, **Cognis**, is open source (`lyzr-cognis`, MIT). It does LLM fact
  extraction with versioned updates, and hybrid vector + BM25 search. But it's Python and keeps its
  index in local files.

**Decision.** Use Cognis as the single builder-memory engine, running as `memory-service/`:
- FastAPI in Docker, with Caddy for HTTPS, on one AWS EC2 instance in ap-south-1, next to Supabase.
- The Next.js app on Vercel calls it over HTTPS with a bearer token through `MemoryProvider`.
- Extraction uses Groq (via LiteLLM); embeddings use Gemini.
- Edits reuse Cognis's update path: close the old version, store the new text re-embedded.
- Memori and its dependencies are removed.

**Consequences.**
- ✅ Architect's builder memory runs on Lyzr's own memory engine. It's semantic (vector + BM25)
  and versioned, not plain string matching.
- ✅ It demonstrates the production split: stateless web on Vercel, stateful services in Docker on
  AWS. The same image runs on any cloud.
- ✅ Memory failures degrade gracefully: chat continues and shows "memory unavailable".
- ⚠️ One more thing to run: an EC2 instance (covered by AWS free-plan credits), plus a
  `MEMORY_SERVICE_TOKEN` to keep secret.
- ⚠️ A single instance holds the index. Scaling out means sharding users across instances or moving
  to a Qdrant cluster (ARCHITECTURE.md §13).
- ⚠️ Edit uses Cognis internals (pinned to `lyzr-cognis==1.0.0`), because the open-source version
  has no public update method.

---

## ADR-007: Positioning: "From prompt to production: AI apps that get found, remember, and run any agent."

- **Date:** 2026-10-08
- **Status:** Accepted (supersedes the hook in ADR-005; the feature set and order are unchanged)

**Context.** The memory-only hook ("Architect remembers, so you never pay for the same mistake
twice") undersold the scope and led with a money complaint. The owner wanted a hook that covers
everything: complete apps, SEO + GEO, memory and multiple agents.

**Decision.** Hook: **"From prompt to production: AI apps that get found, remember, and run any agent."**
- **Prompt to production:** complete apps.
- **Get found:** SEO + GEO, for Google and AI answer engines.
- **Remember:** builder memory and agent memory (Lyzr Cognis).
- **Run any agent:** one spec compiled to any framework.

Fix memory and fair billing remain headline *features*, not the hook.

**Consequences.**
- ✅ Matches the full feature set and is clear to non-technical users.
- ⚠️ "Production" describes the product vision. The prototype's hosting and agent runs are
  simulated, so README, ARCHITECTURE.md §16 and SUBMISSION.md keep their "real vs simulated" notes.
