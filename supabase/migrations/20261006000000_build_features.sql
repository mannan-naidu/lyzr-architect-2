-- Architect 2.0 — tables for the build loop, memory-driven fixes, GitHub and publishing.
-- Idempotent: safe to re-run. All new tables are owner-only via RLS (directly or via the project).

-- ── projects: plan, agent spec, publishing settings ─────────────────────────────────────────
alter table public.projects add column if not exists plan jsonb;
alter table public.projects add column if not exists agent_spec jsonb;
alter table public.projects add column if not exists plan_status text not null default 'none'
  check (plan_status in ('none', 'draft', 'approved'));
alter table public.projects add column if not exists seo_enabled boolean not null default false;
alter table public.projects add column if not exists cms_enabled boolean not null default false;
alter table public.projects add column if not exists deploy_slug text;

-- ── messages: who pays for this turn (fair-billing ledger) and what kind of turn it was ─────
alter table public.messages add column if not exists billed_to text not null default 'user'
  check (billed_to in ('user', 'agent'));
alter table public.messages add column if not exists kind text not null default 'chat'
  check (kind in ('chat', 'plan', 'build', 'fix'));

-- ── project_files: keep the previous version so Pro mode can show a diff ────────────────────
alter table public.project_files add column if not exists previous_content text;
alter table public.project_files add column if not exists updated_by text not null default 'agent'
  check (updated_by in ('agent', 'user'));

-- ── run_events: the agent trace + logs (plan, recall, tool, file, error, fix, deploy) ───────
create table if not exists public.run_events (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  run_id     uuid not null,
  kind       text not null check (kind in ('plan', 'recall', 'tool', 'file', 'error', 'fix', 'deploy', 'log', 'check')),
  title      text not null,
  detail     jsonb not null default '{}'::jsonb,
  tokens_in  integer check (tokens_in >= 0),
  tokens_out integer check (tokens_out >= 0),
  created_at timestamptz not null default now()
);
create index if not exists run_events_project_created_idx on public.run_events (project_id, created_at desc);
alter table public.run_events enable row level security;
drop policy if exists "run_events: project owner can read" on public.run_events;
create policy "run_events: project owner can read" on public.run_events for select to authenticated
  using (public.owns_project(project_id));
drop policy if exists "run_events: project owner can insert" on public.run_events;
create policy "run_events: project owner can insert" on public.run_events for insert to authenticated
  with check (public.owns_project(project_id));

-- ── fix_attempts: fix memory + loop breaker ─────────────────────────────────────────────────
-- error_signature is a normalized fingerprint of the error so the same failure is recognised
-- across sessions and projects (the user's own history), not just within one chat.
create table if not exists public.fix_attempts (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  error_signature text not null,
  error_message   text not null,
  attempt         integer not null check (attempt >= 1),
  fix_summary     text not null,
  outcome         text not null default 'pending' check (outcome in ('pending', 'succeeded', 'failed', 'rolled_back')),
  tokens          integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists fix_attempts_owner_sig_idx on public.fix_attempts (owner_id, error_signature, created_at desc);
alter table public.fix_attempts enable row level security;
drop policy if exists "fix_attempts: owner can read" on public.fix_attempts;
create policy "fix_attempts: owner can read" on public.fix_attempts for select to authenticated
  using (owner_id = (select auth.uid()));
drop policy if exists "fix_attempts: owner can insert" on public.fix_attempts;
create policy "fix_attempts: owner can insert" on public.fix_attempts for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.owns_project(project_id));
drop policy if exists "fix_attempts: owner can update" on public.fix_attempts;
create policy "fix_attempts: owner can update" on public.fix_attempts for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- ── decisions: the project's decision log (shown in the Memory tab, injected every turn) ────
create table if not exists public.decisions (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 500),
  source     text not null default 'plan' check (source in ('plan', 'chat', 'user', 'fix')),
  created_at timestamptz not null default now()
);
create index if not exists decisions_project_idx on public.decisions (project_id, created_at);
alter table public.decisions enable row level security;
drop policy if exists "decisions: project owner can read" on public.decisions;
create policy "decisions: project owner can read" on public.decisions for select to authenticated
  using (public.owns_project(project_id));
drop policy if exists "decisions: project owner can write" on public.decisions;
create policy "decisions: project owner can write" on public.decisions for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- ── github_connections: the user's GitHub token, encrypted by the app (AES-256-GCM) ─────────
create table if not exists public.github_connections (
  user_id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  login            text,
  token_ciphertext text not null,
  scopes           text,
  updated_at       timestamptz not null default now()
);
alter table public.github_connections enable row level security;
drop policy if exists "github_connections: owner only" on public.github_connections;
create policy "github_connections: owner only" on public.github_connections for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── cms_entries: content mode for public sites ──────────────────────────────────────────────
create table if not exists public.cms_entries (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  collection text not null check (collection in ('pages', 'posts', 'faqs')),
  slug       text not null,
  title      text not null,
  body       text not null default '',
  status     text not null default 'draft' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now(),
  unique (project_id, collection, slug)
);
alter table public.cms_entries enable row level security;
drop policy if exists "cms_entries: project owner only" on public.cms_entries;
create policy "cms_entries: project owner only" on public.cms_entries for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- ── deployments: publish results ────────────────────────────────────────────────────────────
alter table public.deployments add column if not exists seo_score integer;
alter table public.deployments add column if not exists security_findings jsonb not null default '[]'::jsonb;
drop policy if exists "deployments: project owner can delete" on public.deployments;
create policy "deployments: project owner can delete" on public.deployments for delete to authenticated
  using (public.owns_project(project_id));

-- Let the API see new tables/columns immediately.
notify pgrst, 'reload schema';
