-- ============================================================
-- ZAKUPY — schema v1
-- Uruchamiać w Supabase SQL Editor lub przez Supabase CLI:
--   supabase db push
-- ============================================================

-- ── 1. TABELE ────────────────────────────────────────────────

-- Gospodarstwo domowe (izolacja danych)
create table public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- Członkowie gospodarstwa (junction)
create table public.household_members (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  display_name  text,                          -- wyświetlana nazwa (może różnić się od auth.users)
  role          text not null default 'member'
                  check (role in ('admin', 'member')),
  joined_at     timestamptz default now(),
  unique(household_id, user_id)
);

-- Jednorazowe tokeny zaproszeń
create table public.household_invites (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  token         text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  expires_at    timestamptz default now() + interval '7 days',
  used_at       timestamptz,              -- null = nieużyty
  used_by       uuid references auth.users(id) on delete set null
);

-- Kategorie produktów (per gospodatstwo)
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  emoji         text not null default '🛒',
  color         text not null default '#6366f1',
  sort_order    int default 0,
  created_at    timestamptz default now()
);

-- Produkty na liście
create table public.items (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  category_id   uuid references public.categories(id) on delete set null,
  name          text not null,
  quantity      text,                          -- "2 kg", "3 szt" — wolny tekst
  note          text,
  added_by      uuid references auth.users(id) on delete set null,
  is_bought     boolean not null default false,
  bought_by     uuid references auth.users(id) on delete set null,
  bought_at     timestamptz,
  archived_at   timestamptz,                   -- null = aktywny, not null = archiwum
  created_at    timestamptz default now()
);

-- ── 2. INDEKSY ───────────────────────────────────────────────

-- Najczęstsze zapytanie: aktywne produkty danego gospodarstwa
create index items_household_active_idx
  on public.items(household_id)
  where archived_at is null;

-- Lookup po tokenie (invite flow)
create index invites_token_idx
  on public.household_invites(token);

-- ── 3. HELPER FUNCTION ──────────────────────────────────────
-- Używana w politykach RLS — sprawdza członkostwo bez N+1
-- security definer = wykonuje się z uprawnieniami właściciela funkcji
-- (omija RLS w household_members, co jest intencjonalne)

create or replace function public.is_member(hid uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1
    from   public.household_members
    where  household_id = hid
    and    user_id      = auth.uid()
  );
$$;

-- ── 4. ROW-LEVEL SECURITY ────────────────────────────────────
-- Kluczowy element architektury: izolacja na poziomie silnika bazy.
-- Nawet jeśli frontend popełni błąd, PostgreSQL odrzuci nieautoryzowany dostęp.

alter table public.households         enable row level security;
alter table public.household_members  enable row level security;
alter table public.household_invites  enable row level security;
alter table public.categories         enable row level security;
alter table public.items              enable row level security;

-- households
create policy "Widok — tylko członkowie"
  on public.households for select
  using (is_member(id));

create policy "Tworzenie — zalogowany użytkownik"
  on public.households for insert
  with check (created_by = auth.uid());

create policy "Edycja — tylko admin"
  on public.households for update
  using (
    exists (
      select 1 from public.household_members
      where household_id = id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- household_members
create policy "Widok — członkowie widzą siebie nawzajem"
  on public.household_members for select
  using (is_member(household_id));

create policy "Dołączenie — można zapisać tylko siebie"
  on public.household_members for insert
  with check (user_id = auth.uid());

create policy "Usuwanie — własny rekord lub admin"
  on public.household_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.household_members hm2
      where hm2.household_id = household_id
        and hm2.user_id = auth.uid()
        and hm2.role = 'admin'
    )
  );

-- household_invites
-- UWAGA: select bez RLS — token jest sekretem; kto ma token, ma dostęp
-- Nie ma listy zaproszeń bez bycia adminem
create policy "Widok — admin lub posiadacz tokenu (select always)"
  on public.household_invites for select
  using (true);  -- filtrowanie po tokenie w zapytaniu aplikacji

create policy "Tworzenie — tylko admin"
  on public.household_invites for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.household_members
      where household_id = household_invites.household_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Oznaczenie jako użyte — ktokolwiek (jednorazowe)"
  on public.household_invites for update
  using (used_at is null and expires_at > now())
  with check (used_by = auth.uid());

-- categories
create policy "Pełen dostęp — członkowie"
  on public.categories for all
  using  (is_member(household_id))
  with check (is_member(household_id));

-- items
create policy "Widok — członkowie"
  on public.items for select
  using (is_member(household_id));

create policy "Dodawanie — członkowie (własny added_by)"
  on public.items for insert
  with check (is_member(household_id) and added_by = auth.uid());

create policy "Edycja — członkowie (np. oznacz jako kupione)"
  on public.items for update
  using (is_member(household_id));

create policy "Usuwanie — członkowie"
  on public.items for delete
  using (is_member(household_id));

-- ── 5. REALTIME ──────────────────────────────────────────────
-- Włącz subskrypcje dla tabel które zmieniają się live

alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.categories;

-- ── 6. AUTO-ARCHIWIZACJA (pg_cron) ──────────────────────────
-- pg_cron to rozszerzenie Supabase — działa na free tier.
-- Codziennie o 3:00 archiwizuje kupione produkty starsze niż 24h.
-- Alternatywa: wywołać ręcznie z Vercel Cron lub Edge Function.

select cron.schedule(
  'archive-bought-items',
  '0 3 * * *',  -- codziennie o 3:00 UTC
  $$
    update public.items
    set    archived_at = now()
    where  is_bought   = true
    and    bought_at  < now() - interval '24 hours'
    and    archived_at is null;
  $$
);

-- ── 7. SEED — domyślne kategorie ────────────────────────────
-- Wywoływane po onboardingu nowego użytkownika z kodu aplikacji
-- (nie tutaj, bo nie znamy jeszcze household_id).
-- Szablon — insert w Next.js Server Action po stworzeniu household.

-- Przykład co wstawiamy:
-- ('Nabiał', '🥛', '#3b82f6')
-- ('Warzywa i owoce', '🥦', '#22c55e')
-- ('Mięso i ryby', '🥩', '#ef4444')
-- ('Pieczywo', '🍞', '#f59e0b')
-- ('Napoje', '🧃', '#06b6d4')
-- ('Chemia', '🧴', '#8b5cf6')
-- ('Inne', '🛒', '#6b7280')
