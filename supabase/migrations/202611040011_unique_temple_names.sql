-- Treat temple names as unique regardless of case or surrounding whitespace.
begin;

do $$
begin
  if exists (
    select 1
    from public.dharma_temples
    group by lower(btrim(name))
    having count(*) > 1
  ) then
    raise exception 'Resolve existing duplicate temple names before applying this migration';
  end if;
end;
$$;

create unique index if not exists dharma_temples_name_ci_key
  on public.dharma_temples (lower(btrim(name)));

create or replace function public.create_dharma_temple(temple_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if temple_name is null or length(btrim(temple_name)) = 0 or length(btrim(temple_name)) > 200 then
    raise exception 'Invalid name' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.dharma_temples
    where lower(btrim(name)) = lower(btrim(temple_name))
  ) then
    raise exception 'Temple name already exists' using errcode = '23505';
  end if;
  insert into public.dharma_temples(name)
  values (btrim(temple_name))
  returning id into new_id;
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
  recipient_exists boolean;
  temple_count bigint;
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if operation = 'rename' then
    if new_name is null or length(btrim(new_name)) = 0 or length(btrim(new_name)) > 200
      or new_caretaker_name is null or length(btrim(new_caretaker_name)) = 0 or length(btrim(new_caretaker_name)) > 200 then
      raise exception 'Invalid temple details' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.dharma_temples
      where id <> target_temple_id
        and lower(btrim(name)) = lower(btrim(new_name))
    ) then
      raise exception 'Temple name already exists' using errcode = '23505';
    end if;
    update public.dharma_temples
    set name = btrim(new_name), caretaker_name = btrim(new_caretaker_name)
    where id = target_temple_id;
    if not found then raise exception 'Temple not found' using errcode = 'P0002'; end if;
  elsif operation = 'delete' then
    lock table public.dharma_recipients in share row exclusive mode;
    perform 1 from public.dharma_temples where id = target_temple_id for update;
    if not found then raise exception 'Temple not found' using errcode = 'P0002'; end if;
    select exists(
      select 1 from public.dharma_recipients where temple_id = target_temple_id
    ) into recipient_exists;
    if recipient_exists then
      raise exception 'Temple has recipients' using errcode = '23503';
    end if;
    select count(*) into temple_count from public.dharma_temples;
    if temple_count <= 1 then
      raise exception 'At least one temple must remain' using errcode = '55000';
    end if;
    delete from public.registry_options where temple_id = target_temple_id;
    delete from public.dharma_user_access where temple_id = target_temple_id;
    delete from public.dharma_temples where id = target_temple_id;
  else
    raise exception 'Invalid operation' using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.manage_dharma_temple(uuid, text, text, text) from public, anon;
grant execute on function public.manage_dharma_temple(uuid, text, text, text) to authenticated;

commit;
