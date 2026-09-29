/**
 * Memori spike — can Memori (BYODB) live in our Supabase Postgres, in its own schema?
 *
 *   pnpm tsx scripts/memori-spike.ts            # BYODB on DATABASE_URL, schema "memori"
 *   pnpm tsx scripts/memori-spike.ts --cloud    # Memori Cloud (needs MEMORI_API_KEY)
 *   pnpm tsx scripts/memori-spike.ts --mock     # force the local mock LLM (no API key needed)
 *
 * Attribution: entity = user id, process = project id (see docs/memori-spike.md).
 * Results and conclusions: docs/memori-spike.md.
 */
import "dotenv/config";

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import Anthropic from "@anthropic-ai/sdk";
import { Memori } from "@memorilabs/memori";
import OpenAI from "openai";
import pg from "pg";

const args = new Set(process.argv.slice(2));
const CLOUD = args.has("--cloud");
const FORCE_MOCK = args.has("--mock");
const SCHEMA = process.env.MEMORI_SCHEMA ?? "memori";
const USER_ID = process.env.SPIKE_USER_ID ?? "spike-user-0001";
const PROJECT_ID = process.env.SPIKE_PROJECT_ID ?? "spike-project-0001";

const log = (step: string, detail?: unknown) =>
  console.log(`\n▸ ${step}${detail === undefined ? "" : `\n${typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)}`}`);

/** Minimal OpenAI-compatible server so the Memori interception path runs without an API key. */
function startMockLlm(): Promise<Server> {
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => {
      const parsed = JSON.parse(body || "{}") as { messages?: { role: string; content: string }[] };
      const system = parsed.messages?.find((m) => m.role === "system")?.content ?? "";
      const recalled = system.includes("<memori_context>");
      const content = recalled
        ? `[mock] I see recalled memory in my system prompt:\n${system}`
        : "[mock] Noted.";
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: "mock-1",
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: "mock-model",
          choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

type Chat = (content: string) => Promise<string>;

async function makeClient(): Promise<{ client: unknown; chat: Chat; label: string; mock?: Server }> {
  if (!FORCE_MOCK && process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic();
    const chat: Chat = async (content) => {
      const res = await client.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 1024,
        output_config: { effort: "low" },
        messages: [{ role: "user", content }],
      });
      return res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    };
    return { client, chat, label: "anthropic:claude-opus-5-5" };
  }
  if (!FORCE_MOCK && process.env.OPENAI_API_KEY) {
    const client = new OpenAI();
    const chat: Chat = async (content) => {
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
      });
      return res.choices[0]?.message?.content ?? "";
    };
    return { client, chat, label: "openai:gpt-4o-mini" };
  }
  const mock = await startMockLlm();
  const { port } = mock.address() as AddressInfo;
  const client = new OpenAI({ apiKey: "mock", baseURL: `http://127.0.0.1:${port}/v1` });
  const chat: Chat = async (content) => {
    const res = await client.chat.completions.create({
      model: "mock-model",
      messages: [{ role: "user", content }],
    });
    return res.choices[0]?.message?.content ?? "";
  };
  return { client, chat, label: `mock (OpenAI-compatible on :${port})`, mock };
}

async function main() {
  const { client, chat, label, mock } = await makeClient();
  log("LLM client", label);

  let pool: pg.Pool | undefined;
  let mem: Memori;

  if (CLOUD) {
    if (!process.env.MEMORI_API_KEY) throw new Error("--cloud needs MEMORI_API_KEY");
    mem = new Memori();
    log("Mode", "Memori Cloud (api.memorilabs.ai)");
  } else {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required for BYODB mode");

    // One-off admin connection to create the schema.
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    await admin.query(`create schema if not exists ${pg.escapeIdentifier(SCHEMA)}`);
    await admin.end();

    // Memori creates unqualified tables, so pin every pooled connection to our schema.
    pool = new pg.Pool({ connectionString, max: 5 });
    pool.on("connect", (conn) => {
      void conn.query(`set search_path to ${pg.escapeIdentifier(SCHEMA)}`);
    });

    mem = new Memori({ conn: () => pool! });
    log("Mode", `BYODB → Postgres schema "${SCHEMA}"`);

    const t0 = Date.now();
    await mem.config.storage!.build();
    log("storage.build() OK", `${Date.now() - t0} ms`);

    const { rows } = await pool.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = $1 order by 1",
      [SCHEMA],
    );
    log(`Tables in "${SCHEMA}"`, rows.map((r) => r.table_name).join(", "));
  }

  mem.llm.register(client).attribution(USER_ID, PROJECT_ID);
  log("Attribution", { entity: USER_ID, process: PROJECT_ID });

  // ── Call 1: state a preference ────────────────────────────────────────────────────────
  const fact = "For every project I build, I prefer Tailwind CSS for styling. Please remember that.";
  log("Call 1 → user", fact);
  log("Call 1 ← assistant", await chat(fact));

  log("Waiting for augmentation (fact extraction)…");
  const flushed = await mem.augmentation.wait(60_000);
  log("augmentation.wait()", flushed ? "flushed" : "timed out / nothing queued");

  // ── Call 2: new session, ask about it ─────────────────────────────────────────────────
  mem.resetSession();
  const question = "Which CSS framework do I prefer for styling?";
  log("Manual recall", await mem.recall(question));
  log("Call 2 (new session) → user", question);
  log("Call 2 ← assistant", await chat(question));

  if (pool) {
    for (const table of ["memori_entity", "memori_process", "memori_conversation_message", "memori_entity_fact"]) {
      const { rows } = await pool.query<{ n: string }>(
        `select count(*)::text as n from ${pg.escapeIdentifier(SCHEMA)}.${pg.escapeIdentifier(table)}`,
      );
      log(`rows in ${table}`, rows[0]?.n);
    }
    await pool.end();
  }
  mock?.close();
}

main().catch((err: unknown) => {
  console.error("\n✖ spike failed:", err);
  process.exit(1);
});
