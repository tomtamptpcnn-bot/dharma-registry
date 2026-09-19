# coding: utf-8
"""Print isolated, rollback-only SQL to test both migrations with local psql."""
from pathlib import Path
print('''\\set ON_ERROR_STOP on
begin;
create schema dharma_migration_test;
create schema dharma_test_auth;
create role dharma_test_anon;
create role dharma_test_authenticated;
create function dharma_test_auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('dharma_test.uid', true), '')::uuid
$$;
create function dharma_test_auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('dharma_test.jwt', true), ''), '{}')::jsonb
$$;
grant usage on schema dharma_migration_test, dharma_test_auth to dharma_test_anon, dharma_test_authenticated;
''')

def migration(name):
    sql = Path('supabase/migrations/' + name).read_text()
    import re
    sql = re.sub(r'^begin;\s*|^commit;\s*', '', sql, flags=re.M)
    sql = sql.replace('public.', 'dharma_migration_test.').replace("table_schema = 'public'", "table_schema = 'dharma_migration_test'")
    sql = sql.replace('auth.', 'dharma_test_auth.')
    sql = re.sub(r'\banon\b', 'dharma_test_anon', sql)
    sql = re.sub(r'\bauthenticated\b', 'dharma_test_authenticated', sql)
    print(sql)

migration('202609180001_create_dharma_recipients.sql')
print("insert into dharma_migration_test.dharma_recipients(full_name, note, recommended_by) values ('Existing migration test', 'Existing place', 'Existing teacher');")
migration('202609180002_registry_options_and_import.sql')
migration('202609180002_registry_options_and_import.sql')
migration('202609190001_edit_delete_registry_options.sql')
print('''
do $$ begin
 if (select count(*) from dharma_migration_test.dharma_recipients) <> 15 then raise exception 'Import is not idempotent'; end if;
 if not exists (select 1 from dharma_migration_test.dharma_recipients where full_name = 'Existing migration test' and received_place = 'Existing place') then raise exception 'Existing note was not preserved'; end if;
 if (select count(*) from dharma_migration_test.dharma_recipients where received_date = '2016-01-02') <> 9 then raise exception 'Wrong 2559 date conversion'; end if;
 if (select count(*) from dharma_migration_test.dharma_recipients where received_date = '2015-12-28') <> 5 then raise exception 'Wrong 2558 date conversion'; end if;
 if (select count(*) from dharma_migration_test.registry_options) <> 18 then raise exception 'Unexpected option count'; end if;
end $$;
set local role dharma_test_anon;
do $$ begin
 begin
  perform * from dharma_migration_test.registry_options;
  raise exception 'Anon unexpectedly read master data';
 exception when insufficient_privilege then null;
 end;
 begin
  perform * from dharma_migration_test.dharma_recipients;
  raise exception 'Anon unexpectedly read recipients';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
select set_config('dharma_test.uid', '11111111-1111-4111-8111-111111111111', true);
select set_config('dharma_test.jwt', '{"is_anonymous":false}', true);
set local role dharma_test_authenticated;
do $$ begin
 if (select count(*) from dharma_migration_test.dharma_recipients) <> 15 then raise exception 'Authenticated read denied'; end if;
end $$;
insert into dharma_migration_test.registry_options(category, value) values ('class_name', 'Test class');
insert into dharma_migration_test.dharma_recipients(full_name, class_name, received_place) values ('Test CRUD', 'Test class', 'Existing place');
update dharma_migration_test.dharma_recipients set age = 40 where full_name = 'Test CRUD';
do $$ begin
 begin
  insert into dharma_migration_test.dharma_recipients(full_name, class_name) values ('Invalid class', 'Unknown');
  raise exception 'Unknown dropdown value accepted';
 exception when foreign_key_violation then null;
 end;
 begin
  insert into dharma_migration_test.registry_options(category, value) values ('class_name', 'Test class');
  raise exception 'Duplicate option accepted';
 exception when unique_violation then null;
 end;
end $$;
do $$ declare target_id uuid; begin
 select id into target_id from dharma_migration_test.registry_options where category = 'class_name' and value = 'Test class';
 perform dharma_migration_test.manage_registry_option(target_id, 'rename', 'Renamed class');
 if not exists (select 1 from dharma_migration_test.dharma_recipients where full_name = 'Test CRUD' and class_name = 'Renamed class') then raise exception 'Rename did not cascade'; end if;
 begin
  perform dharma_migration_test.manage_registry_option(target_id, 'delete', null);
  raise exception 'Deleted used option';
 exception when foreign_key_violation then null;
 end;
 insert into dharma_migration_test.registry_options(category, value) values ('class_name', 'Other class');
 begin
  perform dharma_migration_test.manage_registry_option(target_id, 'rename', 'Other class');
  raise exception 'Duplicate rename accepted';
 exception when unique_violation then null;
 end;
 if not exists (select 1 from dharma_migration_test.registry_options where id = target_id and value = 'Renamed class') then raise exception 'Failed rename did not roll back'; end if;
end $$;
delete from dharma_migration_test.dharma_recipients where full_name = 'Test CRUD';
do $$ declare target_id uuid; begin
 select id into target_id from dharma_migration_test.registry_options where category = 'class_name' and value = 'Renamed class';
 perform dharma_migration_test.manage_registry_option(target_id, 'delete', null);
 if exists (select 1 from dharma_migration_test.registry_options where id = target_id) then raise exception 'Unused delete failed'; end if;
end $$;

select set_config('dharma_test.jwt', '{"is_anonymous":true}', true);
do $$ begin
 begin
  perform dharma_migration_test.manage_registry_option('11111111-1111-4111-8111-111111111111', 'delete', null);
  raise exception 'Anonymous Auth invoked management';
 exception when insufficient_privilege then null;
 end;
 if (select count(*) from dharma_migration_test.registry_options) <> 0 then raise exception 'Anonymous Auth can read options'; end if;
 if (select count(*) from dharma_migration_test.dharma_recipients) <> 0 then raise exception 'Anonymous Auth can read recipients'; end if;
 begin
  insert into dharma_migration_test.registry_options(category, value) values ('level', 'Forbidden');
  raise exception 'Anonymous Auth can insert';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'PASS: migration, preservation, dates, idempotency, options, CRUD and RLS' as result;
''')
