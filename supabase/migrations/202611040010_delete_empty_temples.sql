-- Allow Super Admins to delete an empty branch while preserving its audit trail.
begin;

create or replace function public.log_dharma_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  row_data jsonb;
  old_data jsonb;
  target_temple_id uuid;
  target_id text;
  event_action text;
  event_type text := tg_table_name;
  event_details jsonb := '{}'::jsonb;
  actor_role text;
  actor_name text;
  actor_email text;
begin
  if tg_op = 'DELETE' then
    row_data := to_jsonb(old);
    old_data := row_data;
  else
    row_data := to_jsonb(new);
    if tg_op = 'UPDATE' then old_data := to_jsonb(old); end if;
  end if;

  target_temple_id := (row_data->>'temple_id')::uuid;
  target_id := row_data->>'id';
  event_action := lower(tg_op);
  actor_email := auth.jwt()->>'email';
  actor_name := auth.jwt()->'user_metadata'->>'full_name';
  select a.role into actor_role from public.dharma_user_access a where a.user_id = auth.uid();
  actor_role := coalesce(actor_role, case when auth.uid() is null then 'system' else 'unknown' end);

  if tg_table_name = 'dharma_recipients' then
    event_type := 'recipient';
    event_details := jsonb_build_object('name', row_data->>'full_name');
    if tg_op = 'UPDATE' then
      select coalesce(jsonb_agg(key order by key), '[]'::jsonb) into event_details
      from jsonb_object_keys(row_data) as keys(key)
      where row_data->key is distinct from old_data->key
        and key not in ('id', 'temple_id', 'created_at');
      event_details := jsonb_build_object('name', row_data->>'full_name', 'changed_fields', event_details);
    end if;
  elsif tg_table_name = 'registry_options' then
    event_type := 'option';
    event_details := jsonb_build_object('category', row_data->>'category', 'value', row_data->>'value');
  elsif tg_table_name = 'dharma_temples' then
    event_type := 'temple';
    target_temple_id := (row_data->>'id')::uuid;
    event_details := jsonb_build_object('name', row_data->>'name', 'temple_id', row_data->>'id');
    if tg_op = 'UPDATE' then
      event_details := event_details || jsonb_build_object('previous_name', old_data->>'name');
    elsif tg_op = 'DELETE' then
      -- The deleted temple cannot remain as a foreign key on its own log row.
      target_temple_id := null;
    end if;
  end if;

  insert into public.dharma_activity_logs (
    actor_id, actor_role, actor_name, actor_email, temple_id,
    action, entity_type, entity_id, details
  ) values (
    auth.uid(), actor_role, actor_name, actor_email, target_temple_id,
    event_action, event_type, target_id, coalesce(event_details, '{}'::jsonb)
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

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
    if new_name is null or length(trim(new_name)) = 0 or length(trim(new_name)) > 200
      or new_caretaker_name is null or length(trim(new_caretaker_name)) = 0 or length(trim(new_caretaker_name)) > 200 then
      raise exception 'Invalid temple details' using errcode = '22023';
    end if;
    update public.dharma_temples
    set name = trim(new_name), caretaker_name = trim(new_caretaker_name)
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
