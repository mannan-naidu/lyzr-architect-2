-- Architect 2.0 — initial schema.
-- Every table has RLS enabled with owner-only policies. `(select auth.uid())` is wrapped in a
-- subselect so Postgres evaluates it once per statement instead of once per row.

-- ── Enums ───────────────────────────────────────────────────────────────────────────────────
create type public.app_mode as enum ('simple', 'pro');
create type public.agent_framework as enum ('lyzr', 'langgraph', 'crewai', 'openai-agents', 'custom');
create type public.message_role as enum ('user', 'assistant', 'system', 'tool');
create type public.deployment_status as enum ('queued', 'building', 'ready', 'error', 'canceled');

-- ── Helpers ─────────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ────────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  username       text,
  avatar_url     text,
  preferred_mode public.app_mode not null default 'simple',
  default_model  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: owner can insert"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles: owner can update"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Create a profile row on sign-up, seeded from the GitHub OAuth metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'preferred_username',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── projects ────────────────────────────────────────────────────────────────────────────────
create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 100),
  description    text,
  framework      public.agent_framework not null default 'lyzr',
  mode           public.app_mode not null default 'simple',
  github_repo    text,
  memory_enabled boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index projects_owner_id_updated_at_idx on public.projects (owner_id, updated_at desc);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "projects: owner can read"
  on public.projects for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "projects: owner can insert"
  on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "projects: owner can update"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "projects: owner can delete"
  on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Child tables are owned through their project.
create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and owner_id = (select auth.uid())
  );
$$;

-- ── messages ────────────────────────────────────────────────────────────────────────────────
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  role       public.message_role not null,
  content    text not null,
  model      text,
  tokens_in  integer check (tokens_in >= 0),
  tokens_out integer check (tokens_out >= 0),
  created_at timestamptz not null default now()
);

create index messages_project_id_created_at_idx on public.messages (project_id, created_at);

alter table public.messages enable row level security;

create policy "messages: project owner can read"
  on public.messages for select to authenticated
  using (public.owns_project(project_id));

create policy "messages: project owner can insert"
  on public.messages for insert to authenticated
  with check (public.owns_project(project_id));

create policy "messages: project owner can delete"
  on public.messages for delete to authenticated
  using (public.owns_project(project_id));

-- ── project_files ───────────────────────────────────────────────────────────────────────────
create table public.project_files (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  path       text not null check (char_length(path) between 1 and 512),
  content    text not null default '',
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

create trigger project_files_set_updated_at
  before update on public.project_files
  for each row execute function public.set_updated_at();

alter table public.project_files enable row level security;

create policy "project_files: project owner can read"
  on public.project_files for select to authenticated
  using (public.owns_project(project_id));

create policy "project_files: project owner can insert"
  on public.project_files for insert to authenticated
  with check (public.owns_project(project_id));

create policy "project_files: project owner can update"
  on public.project_files for update to authenticated
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

create policy "project_files: project owner can delete"
  on public.project_files for delete to authenticated
  using (public.owns_project(project_id));

-- ── deployments ─────────────────────────────────────────────────────────────────────────────
create table public.deployments (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  status     public.deployment_status not null default 'queued',
  url        text,
  logs       jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index deployments_project_id_created_at_idx on public.deployments (project_id, created_at desc);

alter table public.deployments enable row level security;

create policy "deployments: project owner can read"
  on public.deployments for select to authenticated
  using (public.owns_project(project_id));

create policy "deployments: project owner can insert"
  on public.deployments for insert to authenticated
  with check (public.owns_project(project_id));

create policy "deployments: project owner can update"
  on public.deployments for update to authenticated
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));
