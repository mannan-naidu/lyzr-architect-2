-- Builder memory stored natively in Postgres (the default MemoryProvider; see ADR-006).
-- Memori's prebuilt engine needs glibc >= 2.38, which Vercel's runtime doesn't have.
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.memories (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content      text not null check (char_length(content) between 1 and 1000),
  project_ids  uuid[] not null default '{}',
  times_seen   integer not null default 1,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  search       tsvector generated always as (to_tsvector('english', content)) stored
);
create index if not exists memories_owner_idx on public.memories (owner_id, last_seen_at desc);
create index if not exists memories_search_idx on public.memories using gin (search);
create index if not exists memories_trgm_idx on public.memories using gin (content extensions.gin_trgm_ops);

alter table public.memories enable row level security;
drop policy if exists "memories: owner only" on public.memories;
create policy "memories: owner only" on public.memories for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Save a fact: reinforce a near-duplicate if one exists, otherwise insert it.
create or replace function public.memory_upsert(p_owner uuid, p_project uuid, p_content text)
returns uuid
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.memories
   where owner_id = p_owner and similarity(content, p_content) > 0.55
   order by similarity(content, p_content) desc
   limit 1;
  if v_id is null then
    insert into public.memories (owner_id, content, project_ids)
    values (p_owner, p_content, array[p_project])
    returning id into v_id;
  else
    update public.memories
       set times_seen = times_seen + 1,
           last_seen_at = now(),
           project_ids = case when p_project = any(project_ids) then project_ids else project_ids || p_project end
     where id = v_id;
  end if;
  return v_id;
end;
$$;

-- Recall: full-text rank on ANY query word (stop words dropped), plus fuzzy word similarity,
-- lightly boosted by reinforcement and recency.
create or replace function public.memory_search(p_owner uuid, p_query text, p_limit integer default 8)
returns table (id uuid, content text, score real, created_at timestamptz)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with q as (
    select websearch_to_tsquery(
             'english',
             regexp_replace(trim(regexp_replace(left(p_query, 2000), '[^[:alnum:][:space:]]', ' ', 'g')), '\s+', ' or ', 'g')
           ) as tsq
  )
  select m.id, m.content,
         (ts_rank_cd(m.search, q.tsq) * 4
          + word_similarity(left(p_query, 500), m.content) * 0.5
          + least(m.times_seen, 5) * 0.02
          + case when m.last_seen_at > now() - interval '30 days' then 0.05 else 0 end)::real as score,
         m.created_at
    from public.memories m, q
   where m.owner_id = p_owner
     and (m.search @@ q.tsq or word_similarity(left(p_query, 500), m.content) > 0.4)
   order by score desc
   limit greatest(1, least(p_limit, 20));
$$;

revoke all on function public.memory_upsert(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.memory_search(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.memory_upsert(uuid, uuid, text) to service_role;
grant execute on function public.memory_search(uuid, text, integer) to service_role;

notify pgrst, 'reload schema';
