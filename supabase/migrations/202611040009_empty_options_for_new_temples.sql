-- New temples start with their own empty option lists.
-- Existing per-temple options and recipient records are left untouched.
begin;

create or replace function public.create_dharma_temple(temple_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if length(trim(temple_name)) = 0 or length(temple_name) > 200 then
    raise exception 'Invalid name' using errcode = '22023';
  end if;
  insert into public.dharma_temples(name)
  values (trim(temple_name))
  returning id into new_id;
  return new_id;
end;
$$;
grant execute on function public.create_dharma_temple(text) to authenticated;

commit;
