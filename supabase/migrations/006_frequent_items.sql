-- ============================================================
-- ZAKUPY — schema v6: Frequent Items RPC
-- ============================================================

create or replace function public.get_frequent_items(p_household_id uuid, p_limit int default 50)
returns table (name text, category_id uuid, occurrence_count bigint)
language sql security definer stable
as $$
  select 
    name, 
    mode() within group (order by category_id) as category_id, 
    count(*) as occurrence_count
  from public.items
  where household_id = p_household_id
    and name is not null
    and name <> ''
  group by name
  order by occurrence_count desc, name asc
  limit p_limit;
$$;
