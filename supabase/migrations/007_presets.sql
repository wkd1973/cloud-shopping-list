-- ============================================================
-- 007_presets.sql
-- Funkcjonalność Szablonów (Presets)
-- ============================================================

create table public.presets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  ingredients text[] not null default '{}',
  created_at timestamptz default now()
);

create index presets_household_idx on public.presets(household_id);

alter table public.presets enable row level security;

create policy "Widok — członkowie"
  on public.presets for select
  using (is_member(household_id));

create policy "Dodawanie — członkowie"
  on public.presets for insert
  with check (is_member(household_id));

create policy "Edycja — członkowie"
  on public.presets for update
  using (is_member(household_id));

create policy "Usuwanie — członkowie"
  on public.presets for delete
  using (is_member(household_id));

-- Realtime
alter publication supabase_realtime add table public.presets;

-- Seed: Dodaj 2 domyślne szablony dla każdego już istniejącego gospodarstwa domowego
insert into public.presets (household_id, name, ingredients)
select id, '🍝 Carbonara', array['makaron spaghetti', 'guanciale', 'jaja', 'pecorino romano', 'pieprz czarny']
from public.households;

insert into public.presets (household_id, name, ingredients)
select id, '🍕 Pizza domowa', array['mąka typu 00', 'drożdże', 'passata pomidorowa', 'mozzarella', 'oliwa z oliwek', 'bazylia']
from public.households;
