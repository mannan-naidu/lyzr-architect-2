# Memori spike (Session 1)

**Question:** Can Memori store and recall per-user and per-project memory in our Supabase
Postgres, in its own schema, from our Next.js/TypeScript stack?

**Timebox:** 1 hour · **Script:** [`scripts/memori-spike.ts`](../scripts/memori-spike.ts)

## TL;DR

- ✅ **The TypeScript SDK supports our own Postgres (BYODB).** `@memorilabs/memori` (use the `beta`
  dist-tag, `0.1.25-beta`; `latest` is an old `0.0.11`) takes a `pg.Pool` via
  `new Memori({ conn: () => pool })` and creates its tables with `storage.build()`.
- ✅ **A separate schema works.** Memori creates *unqualified* tables (`memori_entity`,
  `memori_entity_fact`, …), so we pin `search_path` to `memori` on each pooled connection.
- ⚠️ **"BYODB" is not fully self-hosted.** Fact extraction ("Advanced Augmentation") still sends
  each user/assistant turn to `api.memorilabs.ai` (`sdk/augmentation`). Entity and process ids are
  SHA-256 hashed, but message text is sent. Without a key it is IP-rate-limited.
- ⚠️ **Embeddings run locally** (Rust engine + ONNX `all-MiniLM-L6-v2`, downloaded from Hugging
  Face on first use). That brings a cold-start download and a native binary (~tens of MB) on Vercel.
- ⚠️ **Recall is scoped by entity (user) only** in BYODB mode; `process` (project) is stored but not
  used to filter recall. Per-project isolation is on us.
- ⚠️ **Memori hooks the raw provider SDKs** (Anthropic, OpenAI, Google GenAI), not the Vercel AI SDK.
  We'll call `recall()` ourselves and inject the context into our AI SDK prompts.

**Chosen approach:** BYODB on Supabase Postgres (schema `memori`), with manual `recall()` +
context injection in our AI SDK route. Memori Cloud stays the fallback. Details and the reasons
are below.

## Setup used

```ts
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.on("connect", (c) => c.query('set search_path to "memori"'));   // own schema
const mem = new Memori({ conn: () => pool });
await mem.config.storage!.build();                                   // creates memori_* tables
mem.llm.register(anthropicOrOpenAIClient).attribution(userId, projectId);
```

- **Attribution:** `entity = auth user id`, `process = project id`. Session = one chat thread
  (`mem.setSession(threadId)`).
- **Concurrency:** in a server, use `memori.forRequest({ entityId, processId, sessionId })` per
  request. The shared instance must not be mutated per request.
- **Connection string:** use Supabase's **Session pooler (5432)**. The transaction pooler (6543)
  doesn't keep `SET search_path` across statements.

## What we learned from the source (MemoriLabs/Memori, `memori-ts/` + `core/`)

| Concern | Finding |
| --- | --- |
| DB drivers | `pg`, `mysql2`, `better-sqlite3`, auto-detected from the connection object |
| Tables | `memori_entity`, `memori_process`, `memori_session`, `memori_conversation(_message)`, `memori_entity_fact(_mention)`, `memori_knowledge_graph`, `memori_subject/predicate/object`, `memori_process_attribute`, `memori_schema_version` |
| Recall | Local hybrid search (dense cosine + lexical) over `memori_entity_fact` filtered by `entity_id`. Injects `<memori_context>` into the system prompt and prepends session history. |
| Augmentation | Rust engine → `POST https://api.memorilabs.ai/v1/sdk/augmentation` → writes facts locally |
| Embeddings | `fastembed` (ONNX) running locally, model pulled from Hugging Face |
| Manual API | `mem.recall(query)` returns `{ content, score, dateCreated }[]`. There's no list/update/delete API, so the Memory panel will read and write the `memori_*` tables directly. |

## Run results

Run 1 (2026-09-29, Claude Code sandbox): local Postgres 16 (a stand-in for Supabase, since we
have no credentials yet), mock LLM (no API keys yet).

```
▸ LLM client   mock (OpenAI-compatible on :36537)
▸ Mode         BYODB → Postgres schema "memori"
✖ spike failed: model error: Could not find tokenizer.json for Qdrant/all-MiniLM-L6-v2-onnx:
  request error: CONNECT proxy failed: proxy server responded 403
    at NativeEngine.getEngine → NativeEngine.build → StorageManager.build
```

What this shows:

- ✅ The SDK installs cleanly, the native `linux-x64-gnu` binding loads, `pg` is detected as the
  Postgres dialect, and schema creation in our connection works.
- ❌ **`storage.build()` blocks on downloading the embedding model from Hugging Face.** The engine
  loads the model eagerly, before it runs any migration. So even creating the tables needs
  outbound access to `huggingface.co`. The sandbox blocks that, and we did not work around it.
- 📌 **This matters for production:** every cold Vercel function would download the model (~90 MB)
  unless we cache it. Options: bundle the model files into the deployment and point `HF_HOME` at
  them, run `build()` once in a migration step, or use Memori Cloud.

Not yet verified (it needs `huggingface.co` + `api.memorilabs.ai` allowed, plus an LLM key or the
mock): storing *"prefers Tailwind"* and recalling it in a new session. To re-run:

```bash
DATABASE_URL=postgresql://… pnpm tsx scripts/memori-spike.ts          # BYODB (mock LLM if no key)
MEMORI_API_KEY=… pnpm tsx scripts/memori-spike.ts --cloud             # Memori Cloud
```

## Decision

1. **BYODB in our Supabase Postgres, schema `memori`.** Memories sit next to our data, the Memory
   panel can show, edit and delete rows transparently, and deleting a user can cascade.
2. **Don't use Memori's automatic LLM interception.** In the chat route we'll:
   `facts = await scope.recall(lastUserMessage)` → filter to the current project → inject into the
   system prompt → stream with the AI SDK → then send the turn for augmentation.
3. **Project scoping:** we'll use a composite entity (`${userId}:${projectId}`) for *agent* memory,
   and the plain `userId` for the *builder's* cross-project preferences. The latter is what makes
   "Architect remembers" work across projects.
4. **Fallback:** if the native engine or model download is too heavy for Vercel functions, switch
   to Memori Cloud (`new Memori()` + `MEMORI_API_KEY`). Same code path, and recall/augmentation
   happen server-side at Memori.
5. **Privacy copy in the UI:** "Memory extraction is processed by Memori; conversations are sent
   to Memori's API to extract facts."
