-- Apps don't have to contain AI agents. agents_enabled = false means "a regular app": the planner
-- returns no agents and the agent framework is ignored. true (default) means "add agents only if
-- the app needs AI".
alter table public.projects add column if not exists agents_enabled boolean not null default true;

notify pgrst, 'reload schema';
