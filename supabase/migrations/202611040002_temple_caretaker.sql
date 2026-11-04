-- Adds caretaker display data for projects that already ran migration 001.
begin;

alter table public.dharma_temples
  add column if not exists caretaker_name text not null default '';

drop index if exists public.registry_options_category_value_ci_key;

create or replace function public.create_dharma_temple(temple_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if not public.is_super_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  if length(trim(temple_name)) = 0 or length(temple_name) > 200 then raise exception 'Invalid name' using errcode = '22023'; end if;
  insert into public.dharma_temples(name) values (trim(temple_name)) returning id into new_id;
  insert into public.registry_options (temple_id, category, value)
  select new_id, category, value from public.registry_options
  where temple_id = (select id from public.dharma_temples where name = 'สถานธรรมแก่นโพธิ์')
  on conflict (temple_id, category, (lower(btrim(value)))) do nothing;
  return new_id;
end;
$$;
grant execute on function public.create_dharma_temple(text) to authenticated;

create or replace function public.manage_dharma_temple(
  target_temple_id uuid,
  operation text,
  new_name text default null,
  new_caretaker_name text default null
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
      or new_caretaker_name is null or length(trim(new_caretaker_name)) = 0 or length(trim(new_caretaker_name)) > 200 then
      raise exception 'Invalid temple details' using errcode = '22023';
    end if;
    update public.dharma_temples
    set name = trim(new_name), caretaker_name = trim(new_caretaker_name)
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
revoke all on function public.manage_dharma_temple(uuid, text, text, text) from public, anon;
grant execute on function public.manage_dharma_temple(uuid, text, text, text) to authenticated;

commit;
