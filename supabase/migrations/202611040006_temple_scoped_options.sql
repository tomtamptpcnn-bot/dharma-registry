-- Restore per-temple option lists. Super Admins can choose a temple to manage.
begin;

lock table public.registry_options in share row exclusive mode;

-- The previous shared-list migration left the merged list under Kaen Pho.
-- Copy that complete list to every temple so each branch has independent rows.
insert into public.registry_options (temple_id, category, value)
select t.id, o.category, o.value
from public.dharma_temples t
cross join public.registry_options o
where o.temple_id = (select id from public.dharma_temples where name = 'สถานธรรมแก่นโพธิ์')
  and t.id <> o.temple_id
on conflict (temple_id, category, (lower(btrim(value)))) do nothing;

drop policy if exists options_select on public.registry_options;
drop policy if exists options_insert on public.registry_options;
create policy options_select on public.registry_options for select to authenticated
  using (public.is_super_admin() or temple_id in (select public.current_temple_ids()));
create policy options_insert on public.registry_options for insert to authenticated
  with check (public.is_super_admin() or temple_id in (select public.current_temple_ids()));

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

create or replace function public.manage_registry_option(option_id uuid, operation text, new_value text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.registry_options%rowtype;
  used boolean;
begin
  if auth.uid() is null or coalesce((auth.jwt())->>'is_anonymous', 'false') <> 'false' then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if operation not in ('rename', 'delete') or operation is null then
    raise exception 'Invalid operation' using errcode = '22023';
  end if;
  if operation = 'rename' and (new_value is null or length(trim(new_value)) = 0 or length(trim(new_value)) > 1000) then
    raise exception 'Invalid name' using errcode = '22023';
  end if;
  lock table public.dharma_recipients in share row exclusive mode;
  select * into target from public.registry_options where id = option_id for update;
  if not found then raise exception 'Option not found' using errcode = 'P0002'; end if;
  if not public.is_super_admin() and target.temple_id not in (select public.current_temple_ids()) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if target.category not in ('recommended_by', 'certified_by', 'transmitted_by', 'class_name', 'level', 'received_place') then
    raise exception 'Invalid category' using errcode = '22023';
  end if;
  if operation = 'delete' then
    execute format('select exists(select 1 from public.dharma_recipients where temple_id = $1 and %I = $2)', target.category)
      into used using target.temple_id, target.value;
    if used then raise exception 'Option is in use' using errcode = '23503'; end if;
    delete from public.registry_options where id = target.id;
  else
    execute format('update public.dharma_recipients set %I = $1 where temple_id = $2 and lower(btrim(%I)) = lower(btrim($3))', target.category, target.category)
      using trim(new_value), target.temple_id, target.value;
    update public.registry_options set value = trim(new_value) where id = target.id;
  end if;
end;
$$;
revoke all on function public.manage_registry_option(uuid, text, text) from public, anon;
grant execute on function public.manage_registry_option(uuid, text, text) to authenticated;

commit;
