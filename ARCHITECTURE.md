# Architect 2.0 — Architecture

> Status: skeleton (Session 1). Each section is filled in as the matching feature lands.
> Decisions are logged in [`docs/decisions.md`](docs/decisions.md).

## Sandbox choice

_TODO: Why Sandpack (in-browser) for live preview now and E2B (simulated) for agent code execution; trade-offs vs. WebContainers / Firecracker._

## Agent harness

_TODO: The builder loop (plan → generate files → preview), Memori recall before each turn and save after, and how framework templates (Lyzr, LangGraph, CrewAI, OpenAI Agents) plug in._

## Model-agnostic switching

_TODO: Vercel AI SDK provider registry (Anthropic, OpenAI, Google, OpenRouter), per-project default model, per-message override, token caps._

## Frontend ↔ sandbox ↔ backend + live preview

_TODO: Request flow diagram: Next.js UI → route handlers / server actions → LLM + Supabase → files → Sandpack preview._

## Proxy design

_TODO: Server-side LLM proxy (keys never reach the browser), rate limiting, token accounting, `proxy.ts` session refresh + route guard._

## GitHub integration

_TODO: OAuth scope strategy, token storage, Octokit import / push-to-new-repo flow._

## Deployment strategy

_TODO: Vercel for the platform itself; simulated deploy pipeline for generated agents (and Vercel API if time allows)._

## Scaling to thousands of concurrent users

_TODO: Stateless Next.js on Vercel, Supabase pooling (Supavisor), streaming responses, queueing long jobs, per-user rate limits, Memori engine lifecycle._

## Memory layer (Memori)

_TODO: Memori BYODB in the `memori` schema, attribution (entity = user, process = project), recall/augmentation flow, Memory panel (list/edit/delete), privacy notes. See [`docs/memori-spike.md`](docs/memori-spike.md)._
