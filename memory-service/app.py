"""
Architect memory service: Lyzr Cognis (open source) behind a small authenticated HTTP API.

Why a separate service (ARCHITECTURE.md §4, ADR-006): Cognis keeps its index in local files
(SQLite + an in-process Qdrant), which needs a persistent disk and a long-lived process. Vercel
functions have neither, so this runs in Docker on AWS EC2 and the Next.js app calls it.

Scoping: owner_id = Architect user id, agent_id = "architect-builder" (so memories follow the
user across projects), session_id = project id (so we know where a fact was learned).
"""

from __future__ import annotations

import hmac
import logging
import os
import queue
import re
import sqlite3
import threading
import time
from typing import Any, Optional

from cognis import Cognis
from cognis.config import CognisConfig
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, Field

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
log = logging.getLogger("memory-service")

AGENT_ID = "architect-builder"
TOKEN = os.environ.get("MEMORY_SERVICE_TOKEN", "")
if len(TOKEN) < 32:
    raise RuntimeError("MEMORY_SERVICE_TOKEN must be set (at least 32 characters).")

config = CognisConfig.from_env(
    # Fact extraction through LiteLLM; Groq by default (reads GROQ_API_KEY).
    llm_model=os.environ.get("COGNIS_LLM_MODEL", "groq/openai/gpt-oss-20b"),
    # The stable Gemini embedding model (Cognis 1.0.0's config default is a preview model that
    # not every key can use). 768 dims, truncated to 256 for the fast search tier.
    embedding_model=os.environ.get("COGNIS_EMBEDDING_MODEL", "gemini/gemini-embedding-001"),
    # Architect recalls extracted facts, not raw chat lines: skip embedding every message (saves
    # two embedding calls per turn and shortens the time a capture holds the lock).
    enable_immediate_recall=False,
)
DATA_DIR = os.environ.get("COGNIS_DATA_DIR", "/data")
memory = Cognis(
    data_dir=DATA_DIR,
    owner_id="bootstrap",
    agent_id=AGENT_ID,
    config=config,
)

# Cognis's local Qdrant and SQLite handles are single-process; serialise access across threads.
# A capture (LLM + embedding calls) can hold this for many seconds, so reads avoid it: listing
# uses its own read-only SQLite connection (WAL mode allows it), and recall falls back to the
# keyword index when the lock is busy.
lock = threading.Lock()
RECALL_LOCK_WAIT_S = 2.5


def read_db() -> sqlite3.Connection:
    conn = sqlite3.connect(f"file:{os.path.join(os.path.expanduser(DATA_DIR), 'cognis.db')}?mode=ro", uri=True, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


ROW_COLUMNS = "m.memory_id, m.content, m.category, m.version, m.created_at, m.updated_at, m.session_id"


def row_item(r: sqlite3.Row, project_id: Optional[str], score: Optional[float] = None) -> dict[str, Any]:
    item = {
        "id": r["memory_id"],
        "content": r["content"],
        "category": r["category"],
        "version": r["version"] or 1,
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
        "in_project": project_id is not None and r["session_id"] == project_id,
    }
    if score is not None:
        item["score"] = score
    return item


STOP_WORDS = set(
    "the and for are but not you your yours with this that these those from have has had was were will would "
    "can could should what when where which who whom why how all any each few more most other some such "
    "into onto over under than then there their them they its our ours out off own same just also very "
    "about again only once here both being been does did doing done make made want like need get got use "
    "user users app apps please let lets i'm".split()
)


def keyword_recall(user_id: str, project_id: str, query: str, limit: int) -> list[dict[str, Any]]:
    """BM25 over Cognis's own FTS5 index (the keyword half of its hybrid search), lock-free."""
    words = [w for w in re.findall(r"[A-Za-z0-9]+", query.lower()) if len(w) > 2 and w not in STOP_WORDS][:24]
    if not words:
        return []
    fts = " OR ".join(f'"{w}"' for w in words)
    with read_db() as conn:
        rows = conn.execute(
            f"""SELECT {ROW_COLUMNS}, bm25(memories_fts) AS rank
                  FROM memories_fts f JOIN memories m ON f.rowid = m.rowid
                 WHERE memories_fts MATCH ? AND f.owner_id = ? AND f.agent_id = ?
                   AND f.is_current = 1 AND m.status != 'deleted'
                 ORDER BY rank LIMIT ?""",
            (fts, user_id, AGENT_ID, limit),
        ).fetchall()
    # bm25() is negative (lower = better); map to a modest 0.15–0.45 so it reads as "keyword match".
    return [row_item(r, project_id, round(min(0.45, 0.15 + abs(r["rank"]) / 20), 3)) for r in rows]

app = FastAPI(title="Architect memory service", version="1.0.0", docs_url=None, redoc_url=None)


def require_token(authorization: str = Header(default="")) -> None:
    supplied = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(supplied.encode(), TOKEN.encode()):
        raise HTTPException(status_code=401, detail="unauthorized")


def scrub(message: str) -> str:
    """Error text safe to return: no API keys (Gemini puts ?key= in URLs) or bearer tokens."""
    message = re.sub(r"(key=)[^&\s\"']+", r"\1***", message)
    message = re.sub(r"(AIza|gsk_|sk-)[A-Za-z0-9_\-]{8,}", r"\1***", message)
    return message.replace(TOKEN, "***")[:500]


stats: dict[str, Any] = {"captures_ok": 0, "captures_empty": 0, "captures_failed": 0, "last_error": None}

# ── Capture runs in the background so the chat never waits on fact extraction ──────────────────
captures: "queue.Queue[dict[str, Any]]" = queue.Queue(maxsize=500)


def capture_worker() -> None:
    while True:
        job = captures.get()
        try:
            with lock:
                result = memory.add(
                    messages=[
                        {"role": "user", "content": job["user_text"]},
                        {"role": "assistant", "content": job["assistant_text"]},
                    ],
                    owner_id=job["user_id"],
                    agent_id=AGENT_ID,
                    session_id=job["project_id"],
                )
            log.info("capture user=%s… %s", job["user_id"][:8], result.get("message"))
            stats["captures_ok" if result.get("memories") else "captures_empty"] += 1
        except Exception as err:  # never let one bad turn kill the worker
            log.exception("capture failed")
            stats["captures_failed"] += 1
            stats["last_error"] = scrub(f"{type(err).__name__}: {err}")
        finally:
            captures.task_done()


threading.Thread(target=capture_worker, daemon=True).start()


def to_item(m: dict[str, Any], project_id: Optional[str] = None) -> dict[str, Any]:
    meta = m.get("metadata") or {}
    return {
        "id": m.get("memory_id") or m.get("id"),
        "content": m.get("content", ""),
        "category": meta.get("category") if isinstance(meta, dict) else None,
        "version": m.get("version", 1),
        "created_at": m.get("created_at"),
        "updated_at": m.get("updated_at"),
        "in_project": project_id is not None and m.get("session_id") == project_id,
    }


# ── API ─────────────────────────────────────────────────────────────────────────────────────────
class RecallIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    project_id: str = Field(min_length=1, max_length=64)
    query: str = Field(min_length=1, max_length=4000)
    limit: int = Field(default=6, ge=1, le=20)


class CaptureIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    project_id: str = Field(min_length=1, max_length=64)
    user_text: str = Field(min_length=1, max_length=8000)
    assistant_text: str = Field(default="", max_length=8000)


class EditIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    content: str = Field(min_length=1, max_length=1000)


class ForgetIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    project_id: str = Field(min_length=1, max_length=64)


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "engine": "lyzr-cognis", "queued_captures": captures.qsize()}


@app.post("/v1/selftest", dependencies=[Depends(require_token)])
def selftest() -> dict[str, Any]:
    """One real embedding and one real extraction call, with timings and scrubbed errors."""
    out: dict[str, Any] = {
        "embedding_model": config.embedding_model,
        "llm_model": config.llm_model,
        **stats,
    }
    t = time.time()
    try:
        emb = memory._embedder.embed_query("The user deploys on Vercel.")  # noqa: SLF001
        dims = sorted(emb.embeddings.keys())
        out["embedding"] = {"ok": bool(emb.get(config.embedding_full_dim)), "dims": dims, "ms": int((time.time() - t) * 1000)}
    except Exception as err:
        out["embedding"] = {"ok": False, "error": scrub(f"{type(err).__name__}: {err}")}
    t = time.time()
    try:
        # Call the model directly (Cognis's _extract_facts swallows errors) so failures are visible.
        reply = memory._extractor._llm_call('Reply with exactly: {"facts": ["The user deploys on Vercel."]}')  # noqa: SLF001
        out["extraction"] = {"ok": "facts" in reply, "reply": reply[:120], "ms": int((time.time() - t) * 1000)}
    except Exception as err:
        out["extraction"] = {"ok": False, "error": scrub(f"{type(err).__name__}: {err}")}
    return out


@app.post("/v1/recall", dependencies=[Depends(require_token)])
def recall(body: RecallIn) -> dict[str, Any]:
    if not lock.acquire(timeout=RECALL_LOCK_WAIT_S):
        # A capture is running: answer from the keyword index instead of waiting.
        return {"memories": keyword_recall(body.user_id, body.project_id, body.query, body.limit), "mode": "keyword"}
    try:
        res = memory.search(
            query=body.query,
            limit=body.limit,
            owner_id=body.user_id,
            agent_id=AGENT_ID,
            session_id=body.project_id,
        )
    finally:
        lock.release()
    out = []
    for r in res.get("results", []):
        # Search also returns raw recent messages from the session; keep extracted facts only.
        if r.get("source") == "message" or r.get("type") == "message":
            continue
        out.append({**to_item(r, body.project_id), "score": float(r.get("score") or 0)})
    return {"memories": out, "mode": "hybrid"}


@app.post("/v1/capture", status_code=202, dependencies=[Depends(require_token)])
def capture(body: CaptureIn) -> dict[str, Any]:
    try:
        captures.put_nowait(body.model_dump())
    except queue.Full:
        raise HTTPException(status_code=503, detail="capture queue full")
    return {"queued": True}


@app.get("/v1/memories", dependencies=[Depends(require_token)])
def list_memories(
    user_id: str = Query(min_length=1, max_length=64),
    project_id: Optional[str] = Query(default=None, max_length=64),
) -> dict[str, Any]:
    # Lock-free: never waits behind a running capture.
    with read_db() as conn:
        rows = conn.execute(
            f"""SELECT {ROW_COLUMNS} FROM memories m
                 WHERE m.owner_id = ? AND m.agent_id = ? AND m.is_current = 1 AND m.status = 'current'
                 ORDER BY m.updated_at DESC LIMIT 300""",
            (user_id, AGENT_ID),
        ).fetchall()
    return {"memories": [row_item(r, project_id) for r in rows]}


@app.patch("/v1/memories/{memory_id}", dependencies=[Depends(require_token)])
def edit_memory(memory_id: str, body: EditIn) -> dict[str, Any]:
    """Edit = Cognis's own UPDATE path: close the old version, store the new text re-embedded."""
    with lock:
        old = memory._sqlite.get_memory(memory_id, body.user_id)  # noqa: SLF001 (pinned 1.0.0)
        if old is None or not old.is_current:
            raise HTTPException(status_code=404, detail="memory not found")
        memory._sqlite.mark_historical(memory_id, body.user_id)  # noqa: SLF001
        memory._qdrant.update_payload(memory_id, {"is_current": False, "status": "historical"})  # noqa: SLF001
        new = memory._extractor._create_and_store(  # noqa: SLF001
            body.content.strip(),
            body.user_id,
            old.session_id,
            old.agent_id,
            replaces_id=memory_id,
            version=old.version + 1,
        )
        if new is None:  # embedding failed: restore the old version
            memory._sqlite.update_memory(memory_id, body.user_id, {"is_current": 1, "status": "current", "valid_until": None})  # noqa: SLF001
            memory._qdrant.update_payload(memory_id, {"is_current": True, "status": "current"})  # noqa: SLF001
            raise HTTPException(status_code=502, detail="could not embed the new text")
    return {"id": new.memory_id, "version": new.version}


@app.delete("/v1/memories/{memory_id}", dependencies=[Depends(require_token)])
def delete_memory(memory_id: str, user_id: str = Query(min_length=1, max_length=64)) -> dict[str, Any]:
    with lock:
        res = memory.delete(memory_id, owner_id=user_id)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail="memory not found")
    return {"deleted": True}


@app.post("/v1/forget-project", dependencies=[Depends(require_token)])
def forget_project(body: ForgetIn) -> dict[str, Any]:
    """Delete facts learned in this project (and its raw messages); other projects' facts stay."""
    with lock:
        res = memory.get_all(limit=1000, owner_id=body.user_id, agent_id=AGENT_ID, include_historical=True)
        removed = 0
        for m in res.get("memories", []):
            if m.get("session_id") == body.project_id:
                deleted = memory.delete(m.get("memory_id") or m.get("id"), owner_id=body.user_id).get("success")
                if deleted and m.get("status", "current") == "current":
                    removed += 1
        memory._sqlite.clear(body.user_id, session_id=body.project_id)  # noqa: SLF001 raw messages
    return {"removed": removed}
