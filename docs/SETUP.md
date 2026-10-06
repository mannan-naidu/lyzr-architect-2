# Setup checklist (manual steps)

Things only a human can do. Do them in order — later steps need values from earlier ones.
**Never paste keys into chat or commit them.** Put them in `.env.local` (local), the Claude Code
cloud environment's variables, and Vercel's environment variables.

## 0. Sandbox network allowlist (Claude Code cloud environment)

Session title bar → cloud environment menu → **Edit** → **Network access**. Allow:

- [ ] `ui.shadcn.com` — shadcn/ui component registry (blocks `shadcn init/add`)
- [ ] `*.supabase.co` and `api.supabase.com` — your project + `supabase db push`
- [ ] `api.openai.com`, `generativelanguage.googleapis.com`, `openrouter.ai` — LLM providers you use
      (`api.anthropic.com` is already allowed)

## 1. Create the Supabase project

- [ ] https://supabase.com/dashboard → **New project** → name `lyzr-architect`, pick a region close
      to your Vercel region (e.g. `us-east-1` ↔ Vercel `iad1`), set a strong DB password (save it in
      a password manager).
- [ ] **Project Settings → API**: copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`, **anon /
      publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, **service_role key** →
      `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **Connect** (top bar) → **Connection string** → **Session pooler** (port 5432) → copy, fill in
      the password → `DATABASE_URL`.
- [ ] **Authentication → URL Configuration**: Site URL = your Vercel production URL; add Redirect
      URLs `http://localhost:3000/auth/callback` and `https://*-<your-vercel-team>.vercel.app/auth/callback`
      (preview deployments) and `https://<prod-domain>/auth/callback`.

## 2. Create the GitHub OAuth App

- [ ] GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
  - Application name: `Architect 2.0`
  - Homepage URL: your Vercel production URL
  - **Authorization callback URL:** `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
- [ ] **Register application** → copy the **Client ID** → **Generate a new client secret** → copy it.
- [ ] Supabase → **Authentication → Sign In / Providers → GitHub** → enable, paste Client ID and
      Client Secret → **Save**.

> The app requests the `repo` scope at login so we can push later. See ADR-002 for the trade-off.

## 2b. Google sign-in (OAuth client)

- [ ] https://console.cloud.google.com → create or pick a project → **APIs & Services → OAuth
      consent screen**: External, app name `Architect 2.0`, support email, scopes `openid`,
      `email`, `profile` → add yourself as a test user (or publish).
- [ ] **APIs & Services → Credentials → Create credentials → OAuth client ID** → *Web
      application*.
  - Authorized JavaScript origins: `http://localhost:3000` and your Vercel URL.
  - **Authorized redirect URI:** `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
- [ ] Copy the **Client ID** and **Client secret** → Supabase → **Authentication → Sign In /
      Providers → Google** → enable, paste both → **Save**.

## 2c. Demo mode (guest access for reviewers)

- [ ] Supabase → **Authentication → Sign In / Providers → Allow anonymous sign-ins** → enable →
      Save. ("Try the demo" creates a real but anonymous user, so RLS still applies, plus a
      seeded sample project. Guests get the lower `DEMO_TOKEN_CAP`.)
- [ ] Recommended: enable **CAPTCHA** (Authentication → Bot and Abuse Protection) once public,
      since anonymous sign-ups can be abused.

## 3. Apply the database migrations

> **Easiest:** Supabase → SQL Editor → New query → paste the whole of **`supabase/setup.sql`** → Run.
> It is idempotent (safe on a fresh or half-migrated database, and safe to re-run).
>
> The cloud sandbox can't open raw Postgres connections (port 5432), so use either the SQL Editor or give Claude a Supabase **personal
> access token** (Account → Access Tokens) as the `SUPABASE_ACCESS_TOKEN` environment variable,
> and it runs them over HTTPS via the Management API.
>
> For `DATABASE_URL` use **Connect → Session pooler** (`postgres.<ref>@aws-…pooler.supabase.com:5432`),
> not the direct `db.<ref>.supabase.co` host: that one is IPv6-only and unreachable from Vercel.


From a machine (or the cloud session) with network access to Supabase:

```bash
pnpm dlx supabase login                     # opens a browser / asks for an access token
pnpm dlx supabase link --project-ref <ref>  # ref = the xxx in xxx.supabase.co
pnpm db:migrate                             # = supabase db push
```

Or paste `supabase/migrations/*.sql` into **SQL Editor → New query → Run**.

## 4. LLM keys (at least one)

- [ ] Anthropic: https://console.anthropic.com/settings/keys → `ANTHROPIC_API_KEY`
- [ ] OpenAI: https://platform.openai.com/api-keys → `OPENAI_API_KEY`
- [ ] Google: https://aistudio.google.com/apikey → `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] OpenRouter: https://openrouter.ai/settings/keys → `OPENROUTER_API_KEY`

## 4b. GitHub push key

`GITHUB_TOKEN_KEY` encrypts users' GitHub tokens at rest. Generate one with
`openssl rand -base64 32` and add it to Vercel's environment variables. Without it, a key is
derived from `SUPABASE_SERVICE_ROLE_KEY`; this works, but rotating that key then invalidates
stored tokens, and users have to reconnect GitHub.

## 5. Import the repo into Vercel

- [ ] https://vercel.com/new → **Import Git Repository** → `mannan-naidu/lyzr-architect-2`.
- [ ] Framework preset: Next.js (auto). Install command: `pnpm install` (auto from lockfile).
- [ ] **Environment Variables**: paste every variable from `.env.example` with real values, for
      Production + Preview + Development.
- [ ] **Deploy**. Then copy the production URL back into Supabase (step 1, URL Configuration) and
      the GitHub OAuth App's Homepage URL.

## 6. Claude Code cloud environment variables

- [ ] Environment menu → **Edit** → **Environment variables**: add the same keys so Claude can run
      migrations and the app against your real project.

## 7. Smoke test

- [ ] `pnpm dev` → http://localhost:3000/login → **Continue with GitHub** → lands on `/dashboard`.
- [ ] Supabase → **Table Editor → profiles** shows your row.
- [ ] Create a project in the dashboard → it appears in the list and in **Table Editor → projects**.

## 8. Memory service on AWS (Lyzr Cognis in Docker)

Builder memory runs as its own service (`memory-service/`, ADR-006), because it needs a disk and a
warm process that Vercel functions don't have.

1. **Keys:** a Gemini API key (aistudio.google.com, free tier; used for embeddings) and your Groq
   key (used for fact extraction).
2. **EC2:** region **ap-south-1 (Mumbai)**, next to Supabase.
   - Launch **Ubuntu Server 24.04**, instance type **t3.small**, storage 20 GB gp3, no key pair.
   - Allow **SSH, HTTP and HTTPS**.
3. **Set up:** open Instance → **Connect → EC2 Instance Connect** and run:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/mannan-naidu/lyzr-architect-2/claude/jolly-lamport-0pzmql/memory-service/setup.sh | sudo bash
   ```
   - The script installs Docker, fetches the code, and asks for the two keys (input hidden).
   - It starts the service behind Caddy with HTTPS at `https://<ip-with-dashes>.sslip.io`, then
     prints `MEMORY_SERVICE_URL` and `MEMORY_SERVICE_TOKEN`.
4. **Vercel:** add those two variables under Settings → Environment Variables, then redeploy.
5. **Check:** signed in, open `/api/health`. It should show `"memory": {"status": "ok", "backend": "cognis"}`.

**Updating the service later:** re-run the same command. It pulls the latest code and keeps your
`.env` and stored memories (Docker volume `cognis-data`).
