-- 确保 profile 用户 ID 关联 auth.users
alter table public.user_profile
  add constraint user_profile_id_auth_users_fk
  foreign key (id)
  references auth.users (id)
  on delete cascade;

-- Auth 用户创建后建立空 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profile (id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
