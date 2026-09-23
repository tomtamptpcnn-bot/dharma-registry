-- Run after 202609230001_transmitting_teacher.sql.
begin;
-- Same lock order as manage_registry_option; wait for existing writes to finish.
lock table public.dharma_recipients in share row exclusive mode;
lock table public.registry_options in share row exclusive mode;

-- Merge existing case/outer-space variants into the oldest option in each
-- category. Move every recipient reference before removing duplicate options.
-- Keep the canonical spelling and ID, and never delete recipient records.
do $$
declare
  duplicate record;
begin
  for duplicate in
    select id, category, value, canonical_value
    from (
      select id, category, value,
        first_value(value) over (
          partition by category, lower(btrim(value)) order by created_at, id
        ) as canonical_value,
        row_number() over (
          partition by category, lower(btrim(value)) order by created_at, id
        ) as position
      from public.registry_options
    ) ranked
    where position > 1
  loop
    execute format(
      'update public.dharma_recipients set %I = $1 where %I = $2',
      duplicate.category, duplicate.category
    ) using duplicate.canonical_value, duplicate.value;
    delete from public.registry_options where id = duplicate.id;
  end loop;
end;
$$;

-- The database enforces this for inserts AND renames, including concurrent
-- requests. Identical names in different categories remain independent.
create unique index if not exists registry_options_category_value_ci_key
  on public.registry_options (category, lower(btrim(value)));
commit;
