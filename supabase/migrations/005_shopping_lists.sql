-- ============================================================
-- ZAKUPY — schema v5: Shopping Lists
-- Dodaje poziom "listy zakupów" między gospodarstwem a produktami.
-- Jedno gospodarstwo może mieć wiele list (cotygodniowe zakupy,
-- świąteczne prezenty, remont kuchni itp.)
-- ============================================================

-- ── 1. TABELA LISTS ──────────────────────────────────────────

create table public.shopping_lists (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  emoji         text not null default '🛒',
  archived_at   timestamptz,        -- null = aktywna, not null = zarchiwizowana
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);

create index lists_household_idx
  on public.shopping_lists(household_id)
  where archived_at is null;

-- ── 2. DODAJ list_id DO ITEMS ────────────────────────────────

alter table public.items
  add column list_id uuid references public.shopping_lists(id) on delete cascade;

-- Indeks dla szybkiego pobierania produktów danej listy
create index items_list_idx
  on public.items(list_id)
  where archived_at is null;

-- ── 3. RLS dla shopping_lists ────────────────────────────────

alter table public.shopping_lists enable row level security;

create policy "Widok — członkowie gospodarstwa"
  on public.shopping_lists for select
  using (is_member(household_id));

create policy "Tworzenie — członkowie"
  on public.shopping_lists for insert
  with check (is_member(household_id) and created_by = auth.uid());

create policy "Edycja — członkowie"
  on public.shopping_lists for update
  using (is_member(household_id));

create policy "Usuwanie — członkowie"
  on public.shopping_lists for delete
  using (is_member(household_id));

-- ── 4. REALTIME ──────────────────────────────────────────────

alter publication supabase_realtime add table public.shopping_lists;

-- ── 5. MIGRACJA ISTNIEJĄCYCH DANYCH ─────────────────────────
-- Dla każdego gospodarstwa utwórz domyślną listę "Zakupy"
-- i przypisz do niej wszystkie istniejące produkty.

with default_lists as (
  insert into public.shopping_lists (household_id, name, emoji)
  select id, 'Zakupy', '🛒'
  from   public.households
  returning id, household_id
)
update public.items
set    list_id = default_lists.id
from   default_lists
where  items.household_id = default_lists.household_id
and    items.list_id is null;
