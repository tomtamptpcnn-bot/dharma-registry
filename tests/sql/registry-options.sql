-- Run ONLY on an empty, disposable PostgreSQL database:
-- psql -v ON_ERROR_STOP=1 -f tests/sql/registry-options.sql
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
-- Test-only Supabase authentication substitutes.
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.user_id', true), '')::uuid;
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select '{"is_anonymous": false}'::jsonb;
$$;
grant usage on schema auth to authenticated, anon;
select set_config('test.user_id', '00000000-0000-4000-8000-000000000001', false);
\ir ../../supabase/migrations/202609180001_create_dharma_recipients.sql
\ir ../../supabase/migrations/202609180002_registry_options_and_import.sql
\ir ../../supabase/migrations/202609190001_edit_delete_registry_options.sql
\ir ../../supabase/migrations/202609230001_transmitting_teacher.sql

-- Both existing variants are referenced: consolidation must retain both people.
do $$
declare category_name text;
begin
  foreach category_name in array array['recommended_by', 'certified_by', 'transmitted_by', 'class_name', 'level', 'received_place'] loop
    insert into public.registry_options(category, value, created_at) values
      (category_name, 'Test Option A', '2020-01-01'),
      (category_name, ' test option a ', '2020-01-02');
    execute format('insert into public.dharma_recipients(full_name, %I) values ($1, $2), ($3, $4)', category_name)
      using 'test original ' || category_name, 'Test Option A', 'test duplicate ' || category_name, ' test option a ';
  end loop;
end;
$$;
\ir ../../supabase/migrations/202609230002_case_insensitive_registry_options.sql
-- Verify rerunning is safe.
\ir ../../supabase/migrations/202609230002_case_insensitive_registry_options.sql

set role authenticated;
do $$
declare
  category_name text;
  option_id uuid;
  other_id uuid;
  references_count integer;
begin
  foreach category_name in array array['recommended_by', 'certified_by', 'transmitted_by', 'class_name', 'level', 'received_place'] loop
    select id into strict option_id from public.registry_options
      where category = category_name and lower(btrim(value)) = 'test option a';
    execute format('select count(*) from public.dharma_recipients where %I = $1', category_name)
      into references_count using 'Test Option A';
    if references_count <> 2 then raise exception 'Migration lost references for %', category_name; end if;
    begin
      insert into public.registry_options(category, value) values(category_name, ' TEST OPTION A ');
      raise exception 'Duplicate insert accepted for %', category_name;
    exception when unique_violation then null;
    end;
    insert into public.registry_options(category, value) values(category_name, 'Test Option B') returning id into other_id;
    begin
      perform public.manage_registry_option(other_id, 'rename', 'test option a');
      raise exception 'Duplicate rename accepted for %', category_name;
    exception when unique_violation then null;
    end;
    if not exists(select 1 from public.registry_options where id = other_id and value = 'Test Option B') then
      raise exception 'Failed rename was not atomic';
    end if;
    -- Editing only the letter case of the same option remains allowed.
    perform public.manage_registry_option(option_id, 'rename', 'TEST OPTION A');
    execute format('select count(*) from public.dharma_recipients where %I = $1', category_name)
      into references_count using 'TEST OPTION A';
    if references_count <> 2 then raise exception 'Rename lost references for %', category_name; end if;
    begin
      perform public.manage_registry_option(option_id, 'delete');
      raise exception 'In-use delete accepted for %', category_name;
    exception when foreign_key_violation then null;
    end;
    if not exists(select 1 from public.registry_options where id = option_id) then
      raise exception 'In-use option was removed';
    end if;
    -- Unused records can be deleted; direct writes cannot bypass the RPC.
    perform public.manage_registry_option(other_id, 'delete');
    if exists(select 1 from public.registry_options where id = other_id) then
      raise exception 'Unused delete failed';
    end if;
    begin
      delete from public.registry_options where id = option_id;
      raise exception 'Direct delete bypassed the RPC';
    exception when insufficient_privilege then null;
    end;
    execute format('update public.dharma_recipients set %I = null where %I = $1', category_name, category_name)
      using 'TEST OPTION A';
    perform public.manage_registry_option(option_id, 'delete');
  end loop;
  if (select count(*) from public.dharma_recipients where full_name like 'test %') <> 12 then
    raise exception 'Recipient records were lost';
  end if;
end;
$$;
select set_config('test.user_id', '', false);
do $$
begin
  begin
    perform public.manage_registry_option(gen_random_uuid(), 'delete');
    raise exception 'Unauthenticated RPC accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
select 'PASS: all six categories, duplicates, merge, rename, delete and access control' as result;
