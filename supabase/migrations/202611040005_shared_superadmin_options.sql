-- Make registry options one shared master list managed only by Super Admins.
begin;

lock table public.dharma_recipients in share row exclusive mode;
lock table public.registry_options in share row exclusive mode;

do $$
declare
  canonical_temple_id uuid;
  duplicate record;
begin
  select id into canonical_temple_id
  from public.dharma_temples
  where name = 'สถานธรรมแก่นโพธิ์';
  if canonical_temple_id is null then
    raise exception 'Canonical temple not found';
  end if;

  -- Merge same category/value across temples and preserve every recipient link.
  for duplicate in
    select id, category, value, canonical_value
    from (
      select id, category, value,
        first_value(value) over (
          partition by category, lower(btrim(value))
          order by (temple_id = canonical_temple_id) desc, created_at, id
        ) as canonical_value,
        row_number() over (
          partition by category, lower(btrim(value))
          order by (temple_id = canonical_temple_id) desc, created_at, id
        ) as position
      from public.registry_options
    ) ranked
    where position > 1
  loop
    execute format(
      'update public.dharma_recipients set %I = $1 where lower(btrim(%I)) = lower(btrim($2))',
      duplicate.category, duplicate.category
    ) using duplicate.canonical_value, duplicate.value;
    delete from public.registry_options where id = duplicate.id;
  end loop;

  update public.registry_options set temple_id = canonical_temple_id;
end;
$$;

-- All signed-in users can read the shared options; only Super Admins can add.
drop policy if exists options_select on public.registry_options;
drop policy if exists options_insert on public.registry_options;
create policy options_select on public.registry_options for select to authenticated
  using (coalesce((auth.jwt())->>'is_anonymous', 'false') = 'false');
create policy options_insert on public.registry_options for insert to authenticated
  with check (public.is_super_admin());

create or replace function public.create_dharma_temple(temple_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if not public.is_super_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  if length(trim(temple_name)) = 0 or length(temple_name) > 200 then raise exception 'Invalid name' using errcode = '22023'; end if;
  insert into public.dharma_temples(name) values (trim(temple_name)) returning id into new_id;
  return new_id;
end;
$$;
grant execute on function public.create_dharma_temple(text) to authenticated;

create or replace function public.manage_registry_option(option_id uuid, operation text, new_value text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.registry_options%rowtype;
  used boolean;
begin
  if not public.is_super_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  if operation not in ('rename', 'delete') or operation is null then
    raise exception 'Invalid operation' using errcode = '22023';
  end if;
  if operation = 'rename' and (new_value is null or length(trim(new_value)) = 0 or length(trim(new_value)) > 1000) then
    raise exception 'Invalid name' using errcode = '22023';
  end if;
  lock table public.dharma_recipients in share row exclusive mode;
  select * into target from public.registry_options where id = option_id for update;
  if not found then raise exception 'Option not found' using errcode = 'P0002'; end if;
  if target.category not in ('recommended_by', 'certified_by', 'transmitted_by', 'class_name', 'level', 'received_place') then
    raise exception 'Invalid category' using errcode = '22023';
  end if;
  if operation = 'delete' then
    execute format('select exists(select 1 from public.dharma_recipients where %I = $1)', target.category)
      into used using target.value;
    if used then raise exception 'Option is in use' using errcode = '23503'; end if;
    delete from public.registry_options where id = target.id;
  else
    execute format('update public.dharma_recipients set %I = $1 where lower(btrim(%I)) = lower(btrim($2))', target.category, target.category)
      using trim(new_value), target.value;
    update public.registry_options set value = trim(new_value) where id = target.id;
  end if;
end;
$$;
revoke all on function public.manage_registry_option(uuid, text, text) from public, anon;
grant execute on function public.manage_registry_option(uuid, text, text) to authenticated;

commit;
