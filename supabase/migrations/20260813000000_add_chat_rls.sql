alter table public.chats enable row level security;
alter table public.messages enable row level security;

revoke all on table public.chats from anon, authenticated;
revoke all on table public.messages from anon, authenticated;

grant select, insert, update, delete
  on table public.chats
  to authenticated;

grant select, insert, delete
  on table public.messages
  to authenticated;

create policy "Users can read their own chats"
  on public.chats
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own chats"
  on public.chats
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own chats"
  on public.chats
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own chats"
  on public.chats
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read messages from their chats"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chats
      where chats.chat_id = messages.chat_id
        and chats.user_id = (select auth.uid())
    )
  );

create policy "Users can create messages in their chats"
  on public.messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.chats
      where chats.chat_id = messages.chat_id
        and chats.user_id = (select auth.uid())
    )
  );

create policy "Users can delete messages from their chats"
  on public.messages
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.chats
      where chats.chat_id = messages.chat_id
        and chats.user_id = (select auth.uid())
    )
  );
