-- Multi-temple support. Run after all existing migrations.
begin;

create table public.dharma_temples (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  caretaker_name text not null default '',
  created_at timestamptz not null default now()
);

insert into public.dharma_temples (name) values ('สถานธรรมแก่นโพธิ์');

create table public.dharma_user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'temple_admin')),
  temple_id uuid references public.dharma_temples(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((role = 'super_admin' and temple_id is null) or (role = 'temple_admin' and temple_id is not null))
);

insert into public.dharma_user_access (user_id, role, temple_id)
select u.id, 'temple_admin', t.id
from auth.users u cross join public.dharma_temples t
on conflict (user_id) do nothing;

alter table public.dharma_recipients add column temple_id uuid references public.dharma_temples(id);
update public.dharma_recipients set temple_id = (select id from public.dharma_temples where name = 'สถานธรรมแก่นโพธิ์');
alter table public.dharma_recipients alter column temple_id set not null;
create index dharma_recipients_temple_created_idx on public.dharma_recipients (temple_id, created_at desc, id);

alter table public.registry_options add column temple_id uuid references public.dharma_temples(id);
update public.registry_options set temple_id = (select id from public.dharma_temples where name = 'สถานธรรมแก่นโพธิ์');
alter table public.registry_options alter column temple_id set not null;
alter table public.registry_options drop constraint registry_options_category_value_key;
drop index if exists public.registry_options_category_value_ci_key;
create unique index registry_options_temple_category_value_key on public.registry_options (temple_id, category, lower(btrim(value)));

alter table public.dharma_temples enable row level security;
alter table public.dharma_user_access enable row level security;
revoke all on public.dharma_temples, public.dharma_user_access from anon, authenticated;
grant select, insert, update on public.dharma_temples to authenticated;
grant select on public.dharma_user_access to authenticated;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.dharma_user_access a where a.user_id = auth.uid() and a.role = 'super_admin' and coalesce((auth.jwt())->>'is_anonymous', 'false') = 'false');
$$;
create or replace function public.current_temple_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select a.temple_id from public.dharma_user_access a where a.user_id = auth.uid() and a.role = 'temple_admin' and coalesce((auth.jwt())->>'is_anonymous', 'false') = 'false';
$$;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.current_temple_ids() to authenticated;

drop policy if exists authenticated_select on public.dharma_recipients;
drop policy if exists authenticated_insert on public.dharma_recipients;
drop policy if exists authenticated_update on public.dharma_recipients;
drop policy if exists authenticated_delete on public.dharma_recipients;
create policy recipient_select on public.dharma_recipients for select to authenticated using (public.is_super_admin() or temple_id in (select public.current_temple_ids()));
create policy recipient_insert on public.dharma_recipients for insert to authenticated with check (public.is_super_admin() or temple_id in (select public.current_temple_ids()));
create policy recipient_update on public.dharma_recipients for update to authenticated using (public.is_super_admin() or temple_id in (select public.current_temple_ids())) with check (public.is_super_admin() or temple_id in (select public.current_temple_ids()));
create policy recipient_delete on public.dharma_recipients for delete to authenticated using (public.is_super_admin() or temple_id in (select public.current_temple_ids()));

drop policy if exists authenticated_options_select on public.registry_options;
drop policy if exists authenticated_options_insert on public.registry_options;
create policy options_select on public.registry_options for select to authenticated using (public.is_super_admin() or temple_id in (select public.current_temple_ids()));
create policy options_insert on public.registry_options for insert to authenticated with check (public.is_super_admin() or temple_id in (select public.current_temple_ids()));
create policy temple_select on public.dharma_temples for select to authenticated using (public.is_super_admin() or id in (select public.current_temple_ids()));
create policy temple_insert on public.dharma_temples for insert to authenticated with check (public.is_super_admin());
create policy temple_update on public.dharma_temples for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy access_select on public.dharma_user_access for select to authenticated using (user_id = auth.uid() or public.is_super_admin());

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
declare target public.registry_options%rowtype; used boolean;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous', 'false') <> 'false' then raise exception 'Authentication required' using errcode = '42501'; end if;
  if operation not in ('rename', 'delete') or operation is null then raise exception 'Invalid operation' using errcode = '22023'; end if;
  if operation = 'rename' and (new_value is null or length(trim(new_value)) = 0 or length(trim(new_value)) > 1000) then raise exception 'Invalid name' using errcode = '22023'; end if;
  lock table public.dharma_recipients in share row exclusive mode;
  select * into target from public.registry_options where id = option_id for update;
  if not found then raise exception 'Option not found' using errcode = 'P0002'; end if;
  if not public.is_super_admin() and target.temple_id not in (select public.current_temple_ids()) then raise exception 'Forbidden' using errcode = '42501'; end if;
  if target.category not in ('recommended_by', 'certified_by', 'transmitted_by', 'class_name', 'level', 'received_place') then raise exception 'Invalid category' using errcode = '22023'; end if;
  if operation = 'delete' then
    execute format('select exists(select 1 from public.dharma_recipients where temple_id = $1 and %I = $2)', target.category) into used using target.temple_id, target.value;
    if used then raise exception 'Option is in use' using errcode = '23503'; end if;
    delete from public.registry_options where id = target.id;
  else
    execute format('update public.dharma_recipients set %I = $1 where temple_id = $2 and %I = $3', target.category, target.category) using trim(new_value), target.temple_id, target.value;
    update public.registry_options set value = trim(new_value) where id = target.id;
  end if;
end;
$$;
revoke all on function public.manage_registry_option(uuid, text, text) from public, anon;
grant execute on function public.manage_registry_option(uuid, text, text) to authenticated;

commit;
