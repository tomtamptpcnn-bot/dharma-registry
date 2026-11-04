-- Audit account and data-management activity by actor and branch.
begin;

create table public.dharma_activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null,
  actor_name text,
  actor_email text,
  temple_id uuid references public.dharma_temples(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index dharma_activity_logs_created_idx on public.dharma_activity_logs (created_at desc, id desc);
create index dharma_activity_logs_temple_created_idx on public.dharma_activity_logs (temple_id, created_at desc, id desc);

alter table public.dharma_activity_logs enable row level security;
revoke all on public.dharma_activity_logs from anon, authenticated;
grant select on public.dharma_activity_logs to authenticated;
create policy activity_logs_select on public.dharma_activity_logs for select to authenticated
  using (public.is_super_admin() or temple_id in (select public.current_temple_ids()));

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
    event_details := jsonb_build_object('name', row_data->>'name');
    if tg_op = 'UPDATE' then
      event_details := event_details || jsonb_build_object('previous_name', old_data->>'name');
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

create trigger dharma_recipients_activity_log
  after insert or update or delete on public.dharma_recipients
  for each row execute function public.log_dharma_activity();
create trigger registry_options_activity_log
  after insert or update or delete on public.registry_options
  for each row execute function public.log_dharma_activity();
create trigger dharma_temples_activity_log
  after insert or update or delete on public.dharma_temples
  for each row execute function public.log_dharma_activity();
-- Explicit events for Auth operations, which do not modify application tables.
create or replace function public.log_activity_event(
  event_action text,
  event_type text,
  event_id text default null,
  target_temple_id uuid default null,
  event_details jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor_role text;
  actor_temple_id uuid;
  actor_name text;
  actor_email text;
begin
  if auth.uid() is null or coalesce((auth.jwt())->>'is_anonymous', 'false') <> 'false' then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select a.role, a.temple_id into actor_role, actor_temple_id
  from public.dharma_user_access a where a.user_id = auth.uid();
  if actor_role is null then raise exception 'Forbidden' using errcode = '42501'; end if;
  if event_action not in ('login', 'logout') or target_temple_id is distinct from actor_temple_id then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  actor_email := auth.jwt()->>'email';
  actor_name := auth.jwt()->'user_metadata'->>'full_name';
  insert into public.dharma_activity_logs (
    actor_id, actor_role, actor_name, actor_email, temple_id,
    action, entity_type, entity_id, details
  ) values (
    auth.uid(), actor_role, actor_name, actor_email, target_temple_id,
    event_action, event_type, event_id, coalesce(event_details, '{}'::jsonb)
  );
end;
$$;
revoke all on function public.log_activity_event(text, text, text, uuid, jsonb) from public, anon;
grant execute on function public.log_activity_event(text, text, text, uuid, jsonb) to authenticated;

commit;
