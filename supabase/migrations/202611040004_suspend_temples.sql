-- Suspend/reactivate temples without deleting their records or manager accounts.
begin;

alter table public.dharma_temples
  add column if not exists is_active boolean not null default true;

create or replace function public.current_temple_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select a.temple_id
  from public.dharma_user_access a
  join public.dharma_temples t on t.id = a.temple_id
  where a.user_id = auth.uid() and a.role = 'temple_admin' and t.is_active
    and coalesce((auth.jwt())->>'is_anonymous', 'false') = 'false'
$$;

drop function if exists public.manage_dharma_temple(uuid, text, text, text, text);

create or replace function public.manage_dharma_temple(
  target_temple_id uuid,
  operation text,
  new_name text default null,
  new_caretaker_name text default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  if operation = 'rename' then
    if new_name is null or length(trim(new_name)) = 0 or length(trim(new_name)) > 200
      or new_caretaker_name is null or length(trim(new_caretaker_name)) = 0 or length(trim(new_caretaker_name)) > 200 then
      raise exception 'Invalid temple details' using errcode = '22023';
    end if;
    update public.dharma_temples
    set name = trim(new_name), caretaker_name = trim(new_caretaker_name)
    where id = target_temple_id;
  elsif operation = 'suspend' then
    update public.dharma_temples set is_active = false where id = target_temple_id;
  elsif operation = 'activate' then
    update public.dharma_temples set is_active = true where id = target_temple_id;
  else
    raise exception 'Invalid operation' using errcode = '22023';
  end if;
  if not found then raise exception 'Temple not found' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.manage_dharma_temple(uuid, text, text, text) from public, anon;
grant execute on function public.manage_dharma_temple(uuid, text, text, text) to authenticated;

commit;
