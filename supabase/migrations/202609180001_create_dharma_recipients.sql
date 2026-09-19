begin;
create table public.dharma_recipients (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(200) not null check (length(trim(full_name)) > 0),
  age integer check (age between 0 and 150),
  nickname varchar(1000),
  address text,
  phone varchar(20) check (phone ~ '^[0-9]*$'),
  recommended_by varchar(1000),
  certified_by varchar(1000),
  received_date date,
  merit_amount numeric(12,2) check (merit_amount >= 0),
  class_name varchar(1000),
  level varchar(1000),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dharma_recipients_created_at_idx on public.dharma_recipients (created_at desc, id);
create index dharma_recipients_received_date_idx on public.dharma_recipients (received_date);
create index dharma_recipients_level_idx on public.dharma_recipients (level);
create function public.set_dharma_recipient_timestamps()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
create trigger dharma_recipients_updated_at
before update on public.dharma_recipients
for each row execute function public.set_dharma_recipient_timestamps();
alter table public.dharma_recipients enable row level security;
alter table public.dharma_recipients force row level security;
revoke all on public.dharma_recipients from anon;
revoke all on public.dharma_recipients from authenticated;
grant select, insert, update, delete on public.dharma_recipients to authenticated;
-- All accounts in this private project are administrators created in Dashboard.
-- Also reject anonymous Auth accounts, which otherwise have authenticated role.
create policy "authenticated_select" on public.dharma_recipients
for select to authenticated
using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false');
create policy "authenticated_insert" on public.dharma_recipients
for insert to authenticated
with check ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false');
create policy "authenticated_update" on public.dharma_recipients
for update to authenticated
using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false')
with check ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false');
create policy "authenticated_delete" on public.dharma_recipients
for delete to authenticated
using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false');
commit;
