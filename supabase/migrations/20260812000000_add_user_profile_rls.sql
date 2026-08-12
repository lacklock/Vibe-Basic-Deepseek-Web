alter table public.user_profile enable row level security;

grant select, insert, update on table public.user_profile to authenticated;

create policy "Users can read their own profile"
  on public.user_profile
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on public.user_profile
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.user_profile
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
