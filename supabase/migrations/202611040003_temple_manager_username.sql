-- Store the login username beside each temple's caretaker details.
begin;

alter table public.dharma_temples
  add column if not exists manager_username text not null default '';

update public.dharma_temples t
set manager_username = split_part(u.email, '@', 1)
from public.dharma_user_access a
join auth.users u on u.id = a.user_id
where a.temple_id = t.id
  and a.role = 'temple_admin'
  and t.manager_username = ''
  and u.email is not null;

drop function if exists public.manage_dharma_temple(uuid, text, text, text);

create or replace function public.manage_dharma_temple(
  target_temple_id uuid,
  operation text,
  new_name text default null,
  new_caretaker_name text default null,
  new_manager_username text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  used boolean;
begin
  if not public.is_super_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  if operation not in ('rename', 'delete') or operation is null then
    raise exception 'Invalid operation' using errcode = '22023';
  end if;
  if operation = 'rename' then
    if new_name is null or length(trim(new_name)) = 0 or length(trim(new_name)) > 200
      or new_caretaker_name is null or length(trim(new_caretaker_name)) = 0 or length(trim(new_caretaker_name)) > 200
      or new_manager_username is null or length(trim(new_manager_username)) < 3 or length(trim(new_manager_username)) > 32 then
      raise exception 'Invalid temple details' using errcode = '22023';
    end if;
    update public.dharma_temples
    set name = trim(new_name), caretaker_name = trim(new_caretaker_name), manager_username = lower(trim(new_manager_username))
    where id = target_temple_id;
    if not found then raise exception 'Temple not found' using errcode = 'P0002'; end if;
  else
    lock table public.dharma_recipients in share row exclusive mode;
    select exists(select 1 from public.dharma_recipients where temple_id = target_temple_id) into used;
    if used then raise exception 'Temple has recipients' using errcode = '23503'; end if;
    delete from public.registry_options where temple_id = target_temple_id;
    delete from public.dharma_temples where id = target_temple_id;
    if not found then raise exception 'Temple not found' using errcode = 'P0002'; end if;
  end if;
end;
$$;
revoke all on function public.manage_dharma_temple(uuid, text, text, text, text) from public, anon;
grant execute on function public.manage_dharma_temple(uuid, text, text, text, text) to authenticated;

commit;
