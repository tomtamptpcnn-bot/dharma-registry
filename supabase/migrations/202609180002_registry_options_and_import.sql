-- Run after 202609180001_create_dharma_recipients.sql.
-- Contains the 14 records supplied by the administrator, not mock data.
-- Buddhist years 2559/2558 have been converted to Gregorian 2016/2015.
-- Transactional and safe to rerun: stable import IDs and duplicate checks.
begin;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dharma_recipients' and column_name = 'note') then
    alter table public.dharma_recipients rename column note to received_place;
  end if;
end;
$$;

create table if not exists public.registry_options (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('recommended_by', 'certified_by', 'class_name', 'level', 'received_place')),
  value text not null check (length(trim(value)) > 0),
  created_at timestamptz not null default now(),
  unique (category, value)
);
alter table public.registry_options enable row level security;
alter table public.registry_options force row level security;
revoke all on public.registry_options from anon, authenticated;
grant select, insert on public.registry_options to authenticated;
drop policy if exists authenticated_options_select on public.registry_options;
create policy authenticated_options_select on public.registry_options for select to authenticated
using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false');
drop policy if exists authenticated_options_insert on public.registry_options;
create policy authenticated_options_insert on public.registry_options for insert to authenticated
with check ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false');

-- Backfill the selector lists from all existing recipients without discarding data.
insert into public.registry_options(category, value)
select distinct v.category, v.value
from public.dharma_recipients r
cross join lateral (values
  ('recommended_by', r.recommended_by), ('certified_by', r.certified_by),
  ('class_name', r.class_name), ('level', r.level), ('received_place', r.received_place)
) v(category, value)
where v.value is not null and length(trim(v.value)) > 0
on conflict (category, value) do nothing;

insert into public.registry_options(category, value) values
  ('certified_by', 'จรัส นาอน'),
  ('certified_by', 'จันทร์มา จันคำ'),
  ('certified_by', 'ชลิดา จันคำ'),
  ('certified_by', 'บุญเฮียง สิงหาขาว'),
  ('level', 'c'),
  ('received_place', 'ผู้เอ็น'),
  ('received_place', 'สิบเมตตา'),
  ('recommended_by', 'ดวง หาญมุงวง'),
  ('recommended_by', 'บุญธรรม ผลิวไล'),
  ('recommended_by', 'ประมงค์ โกดา'),
  ('recommended_by', 'วิทยา ชัยโพธิ์ผัน'),
  ('recommended_by', 'สองเมือง โพธิ์ชัย'),
  ('recommended_by', 'อนงค์ บุญโนนแต้'),
  ('recommended_by', 'แสงเดือน เดือนใส'),
  ('recommended_by', 'ไชยา ชนะน้อย'),
  ('recommended_by', 'ไพยนต์ ต่อพวก')
on conflict (category, value) do nothing;

create or replace function public.validate_recipient_options()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare item record;
begin
  for item in select * from (values
    ('recommended_by', new.recommended_by), ('certified_by', new.certified_by),
    ('class_name', new.class_name), ('level', new.level), ('received_place', new.received_place)
  ) v(category, value) loop
    if item.value is not null and length(trim(item.value)) > 0 and not exists (
      select 1 from public.registry_options o where o.category = item.category and o.value = item.value
    ) then
      raise exception 'Unknown registry option: %', item.category using errcode = '23503';
    end if;
  end loop;
  return new;
end;
$$;
drop trigger if exists dharma_recipients_validate_options on public.dharma_recipients;
create trigger dharma_recipients_validate_options
before insert or update on public.dharma_recipients
for each row execute function public.validate_recipient_options();

-- Source row 1
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select 'd8951dc3-1202-5abe-8659-0d401af92d22'::uuid, 'นาย พัชราพร โพธิ์ชัย', 31, 'แมว', '49 ม.10 บ้านโนนเขวา', '0926494822', 'ไชยา ชนะน้อย', 'จรัส นาอน', '2016-01-02'::date, 100, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นาย พัชราพร โพธิ์ชัย' and received_date = '2016-01-02'::date and phone is not distinct from '0926494822')
on conflict (id) do nothing;

-- Source row 2
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '0c5b1410-9dd5-5edb-9876-b919731b1879'::uuid, 'นางประสิทธิ์ประยูรหาญ', 61, 'สิทธิ์', '45 ม.8 บ้านโนนทอง', null, 'บุญธรรม ผลิวไล', 'จันทร์มา จันคำ', '2016-01-02'::date, 140, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นางประสิทธิ์ประยูรหาญ' and received_date = '2016-01-02'::date and phone is not distinct from null)
on conflict (id) do nothing;

-- Source row 3
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '3006c737-4eda-57d7-a51d-26c80c5ea64f'::uuid, 'นายคมสันต์ งาวชัยภูมิ', 23, null, '149 บ้านยางหวาย', '0831243006', 'วิทยา ชัยโพธิ์ผัน', 'จรัส นาอน', '2016-01-02'::date, 200, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นายคมสันต์ งาวชัยภูมิ' and received_date = '2016-01-02'::date and phone is not distinct from '0831243006')
on conflict (id) do nothing;

-- Source row 4
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select 'b1142592-5750-52f7-9027-ea87c8931600'::uuid, 'นายชโลธร สีเสียด', 20, null, '43 บ้านโคกก่อง', null, 'วิทยา ชัยโพธิ์ผัน', 'จรัส นาอน', '2016-01-02'::date, 200, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นายชโลธร สีเสียด' and received_date = '2016-01-02'::date and phone is not distinct from null)
on conflict (id) do nothing;

-- Source row 5
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '68585684-e48c-5a86-8859-1acf5fd5793a'::uuid, 'นาย อู หงุมเปา', 44, 'อู', '103 ม.1 บ้านโนนเขวา', '0849551923', 'สองเมือง โพธิ์ชัย', 'จรัส นาอน', '2016-01-02'::date, 100, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นาย อู หงุมเปา' and received_date = '2016-01-02'::date and phone is not distinct from '0849551923')
on conflict (id) do nothing;

-- Source row 6
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select 'a3384c8f-edfb-5452-872e-e15b6572a860'::uuid, 'นายชวลิต สว่างรอบ', 19, 'ปอย', '292/3 เขตบางซื่อ กทม.', '0930168490', 'ประมงค์ โกดา', 'จรัส นาอน', '2016-01-02'::date, 200, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นายชวลิต สว่างรอบ' and received_date = '2016-01-02'::date and phone is not distinct from '0930168490')
on conflict (id) do nothing;

-- Source row 7
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '5b222689-cee6-5947-a272-03c62ec59965'::uuid, 'นางเตา ถานันท์', 64, 'เตา', '251 ม.1 บ้านโนนเขวา', null, 'แสงเดือน เดือนใส', 'จันทร์มา จันคำ', '2016-01-02'::date, 100, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นางเตา ถานันท์' and received_date = '2016-01-02'::date and phone is not distinct from null)
on conflict (id) do nothing;

-- Source row 8
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '766d9b24-60bd-5de7-8980-2481b85ad451'::uuid, 'นายหลาวทอง ศรีขันธ์', 59, null, '214 บ้านโคกก่อง', '0918370446', 'ไพยนต์ ต่อพวก', 'จรัส นาอน', '2016-01-02'::date, 200, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นายหลาวทอง ศรีขันธ์' and received_date = '2016-01-02'::date and phone is not distinct from '0918370446')
on conflict (id) do nothing;

-- Source row 9
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '8cb943ac-a603-5d90-ae39-76d058e69717'::uuid, 'นางคำเรียน ชัยคลอง', 66, null, '65 ม.8 บ้านโคกก่อง', null, 'อนงค์ บุญโนนแต้', 'จันทร์มา จันคำ', '2016-01-02'::date, 190, null, 'c', 'ผู้เอ็น'
where not exists (select 1 from public.dharma_recipients where full_name = 'นางคำเรียน ชัยคลอง' and received_date = '2016-01-02'::date and phone is not distinct from null)
on conflict (id) do nothing;

-- Source row 10
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '1f639001-ded4-5226-986b-9eb8ed594b25'::uuid, 'แม่คำพันธ์ ลาดเคดีย์', 59, 'ตุ่น', 'บ้านโคกก่อง', null, 'อนงค์ บุญโนนแต้', 'ชลิดา จันคำ', '2015-12-28'::date, 200, null, 'c', 'สิบเมตตา'
where not exists (select 1 from public.dharma_recipients where full_name = 'แม่คำพันธ์ ลาดเคดีย์' and received_date = '2015-12-28'::date and phone is not distinct from null)
on conflict (id) do nothing;

-- Source row 11
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '42641d41-3944-556b-b099-0eaa56cadfdc'::uuid, 'นาย คลี่ ริมโพธิ์', 67, 'คลี่', 'บ้านหนองทอน', null, 'อนงค์ บุญโนนแต้', 'ชลิดา จันคำ', '2015-12-28'::date, 100, null, 'c', 'สิบเมตตา'
where not exists (select 1 from public.dharma_recipients where full_name = 'นาย คลี่ ริมโพธิ์' and received_date = '2015-12-28'::date and phone is not distinct from null)
on conflict (id) do nothing;

-- Source row 12
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select '34867fda-6879-5169-aa31-298fb14d7caf'::uuid, 'น.ส.พรทิพย์ โนนยะโส', 27, 'แอน', 'บ้านรัตนะ', '0947805255', 'บุญธรรม ผลิวไล', 'บุญเฮียง สิงหาขาว', '2015-12-28'::date, 200, null, 'c', 'สิบเมตตา'
where not exists (select 1 from public.dharma_recipients where full_name = 'น.ส.พรทิพย์ โนนยะโส' and received_date = '2015-12-28'::date and phone is not distinct from '0947805255')
on conflict (id) do nothing;

-- Source row 13
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select 'cce2f926-f46d-5c86-b5d5-84d24a2d2d74'::uuid, 'นายชัยรัช คำพอง', 15, 'ต่อ', 'บ้านโคกก่อง', '0942781608', 'ไพยนต์ ต่อพวก', 'จรัส นาอน', '2015-12-28'::date, 100, null, 'c', 'สิบเมตตา'
where not exists (select 1 from public.dharma_recipients where full_name = 'นายชัยรัช คำพอง' and received_date = '2015-12-28'::date and phone is not distinct from '0942781608')
on conflict (id) do nothing;

-- Source row 14
insert into public.dharma_recipients
  (id, full_name, age, nickname, address, phone, recommended_by, certified_by, received_date, merit_amount, class_name, level, received_place)
select 'c4e7f703-1cd9-524e-a576-7f84da3b28f2'::uuid, 'นายประสิทธิ์ เนยชัยภูมิ', 56, 'แสง', 'บ้านหนองทอน', '0856040902', 'ดวง หาญมุงวง', 'ชลิดา จันคำ', '2015-12-28'::date, 200, null, 'c', 'สิบเมตตา'
where not exists (select 1 from public.dharma_recipients where full_name = 'นายประสิทธิ์ เนยชัยภูมิ' and received_date = '2015-12-28'::date and phone is not distinct from '0856040902')
on conflict (id) do nothing;

commit;
