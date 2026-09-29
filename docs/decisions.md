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
