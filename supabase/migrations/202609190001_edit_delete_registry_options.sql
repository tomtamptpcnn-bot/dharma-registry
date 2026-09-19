begin;
-- All changes are atomic; direct UPDATE/DELETE stays unavailable to clients.
create or replace function public.manage_registry_option(option_id uuid, operation text, new_value text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.registry_options%rowtype;
  used boolean;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous', 'false') <> 'false' then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if operation not in ('rename', 'delete') or operation is null then
    raise exception 'Invalid operation' using errcode = '22023';
  end if;
  if operation = 'rename' and (new_value is null or length(trim(new_value)) = 0 or length(trim(new_value)) > 1000) then
    raise exception 'Invalid name' using errcode = '22023';
  end if;
  -- Block concurrent recipient writes until option references have been changed.
  lock table public.dharma_recipients in share row exclusive mode;
  select * into target from public.registry_options where id = option_id for update;
  if not found then raise exception 'Option not found' using errcode = 'P0002'; end if;
  if target.category not in ('recommended_by', 'certified_by', 'class_name', 'level', 'received_place') then
    raise exception 'Invalid category' using errcode = '22023';
  end if;
  if operation = 'delete' then
    execute format('select exists(select 1 from public.dharma_recipients where %I = $1)', target.category) into used using target.value;
    if used then raise exception 'Option is in use' using errcode = '23503'; end if;
    delete from public.registry_options where id = target.id;
  else
    if target.value = trim(new_value) then return; end if;
    update public.registry_options set value = trim(new_value) where id = target.id;
    execute format('update public.dharma_recipients set %I = $1 where %I = $2', target.category, target.category) using trim(new_value), target.value;
  end if;
end;
$$;
revoke all on function public.manage_registry_option(uuid, text, text) from public, anon;
grant execute on function public.manage_registry_option(uuid, text, text) to authenticated;
commit;
