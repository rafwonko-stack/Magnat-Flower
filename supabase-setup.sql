-- Выполните весь файл один раз в Supabase → SQL Editor.
create table if not exists public.store_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.store_state enable row level security;
revoke all on table public.store_state from anon;
grant select, insert, update on table public.store_state to authenticated;

drop policy if exists "store_select_owner" on public.store_state;
create policy "store_select_owner"
on public.store_state for select to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "store_insert_owner" on public.store_state;
create policy "store_insert_owner"
on public.store_state for insert to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "store_update_owner" on public.store_state;
create policy "store_update_owner"
on public.store_state for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create or replace function public.save_store_state(
  p_data jsonb,
  p_expected_revision bigint
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_revision bigint;
begin
  update public.store_state
  set data = p_data,
      revision = revision + 1,
      updated_at = now()
  where owner_id = (select auth.uid())
    and revision = p_expected_revision
  returning revision into new_revision;

  if new_revision is null then
    raise exception 'SYNC_CONFLICT' using errcode = '40001';
  end if;

  return new_revision;
end;
$$;

revoke execute on function public.save_store_state(jsonb,bigint) from public, anon;
grant execute on function public.save_store_state(jsonb,bigint) to authenticated;
