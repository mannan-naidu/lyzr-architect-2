-- Google sign-in: seed profiles from Google's metadata too (name / picture), not only GitHub's.
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
      new.raw_user_meta_data ->> 'user_name',          -- GitHub
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'full_name',          -- Google
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'             -- Google
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
