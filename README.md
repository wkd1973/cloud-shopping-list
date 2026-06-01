# 🛒 Zakupy — lista zakupów dla domowników

Testowy projekt na stacku **Next.js 15 + Supabase** (Vercel-ready).  
Cel: zweryfikować Realtime, RLS, magic link auth i invite flow przed wdrożeniem w PetCare.

---

## Co to robi

- ✅ Współdzielona lista zakupów dla grupy domowników
- ✅ Live sync — zmiany widoczne u wszystkich **bez przeładowania** (Supabase Realtime)
- ✅ Logowanie bez hasła (magic link na email) oraz przez **Google** i **Facebook** (OAuth)
- ✅ Zapraszanie domowników przez jednorazowy link i podgląd listy członków
- ✅ Obsługa wielu domostw (możliwość przełączania się między gospodarstwami)
- ✅ Kategorie z kolorami i emoji oraz sortowanie produktów (A-Z lub po kategoriach)
- ✅ Autopodpowiedzi najczęściej kupowanych produktów chroniące przed duplikatami
- ✅ Oznaczanie produktów jako kupione → auto-archiwizacja po 24h (pg_cron)
- ✅ Optimistic updates — UI reaguje natychmiast, nie czeka na serwer

---

## Uruchomienie lokalne

### 1. Klonuj i zainstaluj
```bash
git clone ...
cd zakupy
npm install
cp .env.local.example .env.local
```

### 2. Utwórz projekt Supabase
1. Zaloguj się na [supabase.com](https://supabase.com)
2. **New project** → wybierz region `eu-central-1` (Frankfurt) → RODO
3. Skopiuj `Project URL` i `anon public key` z **Settings → API**
4. Wklej do `.env.local`

### 3. Uruchom migrację SQL
W **Supabase Dashboard → SQL Editor** wklej i wykonaj całą zawartość:
```
supabase/migrations/001_initial.sql
```

> Alternatywnie przez CLI: `supabase db push` (wymaga zainstalowanego supabase CLI i linkowania projektu)

### 4. Włącz Realtime
W Dashboard → **Database → Replication** → upewnij się że tabele `items` i `categories` są zaznaczone.

> Migracja robi to automatycznie przez `alter publication supabase_realtime add table...`,  
> ale warto sprawdzić wizualnie.

### 5. Skonfiguruj email auth
W **Authentication → Providers → Email** upewnij się że:
- **Enable Email provider** ✅
- **Confirm email** możesz wyłączyć na czas testów (nie będzie maila potwierdzającego)
- Dodaj `http://localhost:3000/auth/callback` do **Redirect URLs** w Authentication → URL Configuration

### 6. Uruchom lokalnie
```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy na Vercel

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Deploy
vercel

# Dodaj zmienne środowiskowe w Vercel Dashboard
# lub przez CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

W Supabase **Authentication → URL Configuration** dodaj production URL jako Redirect URL:
```
https://twoja-domena.vercel.app/auth/callback
```

---

## Architektura — co i dlaczego

### Przepływ danych

```
Browser (Client Component)
    │  1. Pierwsze dane — props z Server Component (SSR)
    │  2. Zmiany live — Supabase Realtime WebSocket
    ▼
ShoppingList.tsx         ← stan, Realtime subscription
    │
    ├── HeaderBar.tsx    ← sticky header z progress bar
    ├── CategoryFilter   ← poziome filtry
    ├── AddItemForm.tsx  ← dodawanie z kategorią
    └── ItemRow.tsx      ← pojedynczy produkt

Server Component (list/page.tsx)
    │  Pobiera dane z Supabase przez SSR
    │  Nie płaci kosztów client-side waterfall
    ▼
Supabase PostgreSQL
    │  RLS izoluje dane per household_id
    │  Realtime wysyła diff po każdej zmianie
```

### Kluczowe decyzje

#### 1. Server Component → Client Component handoff
`list/page.tsx` to Server Component — pobiera dane, renderuje HTML z wypełnionymi danymi.  
`ShoppingList.tsx` to Client Component — przyjmuje te dane jako `initialItems` i:
- Inicjuje `useState(initialItems)` 
- Subskrybuje Realtime
- Obsługuje akcje użytkownika

**Dlaczego nie fetchować w Client Component?**  
Bo byłby loading state przy każdej wizycie. Z Server Component dane są w HTML od razu.

#### 2. Optimistic Updates (`useOptimistic`)
React 19 `useOptimistic` — UI aktualizuje się **przed** odpowiedzią serwera.  
Użytkownik klika "kupione" → checkbox zaznacza się natychmiast → w tle lecimy update do Supabase.  
Jeśli błąd → rollback do poprzedniego stanu.

Bez tego każde kliknięcie czekałoby ~200ms na odpowiedź API — odczuwalne na mobilnym.

#### 3. Realtime — dlaczego nie polling?
Polling co N sekund to marnowanie zasobów i opóźnienie.  
Supabase Realtime to WebSocket który wysyła **diff** (INSERT/UPDATE/DELETE) natychmiast po zmianie w bazie.

Przy INSERT realtime dostarcza tylko `payload.new` — bez JOIN-ów.  
Dlatego po każdym INSERT robimy dodatkowy select z `category:categories(*)` żeby mieć pełny obiekt.  
Jeden extra select per INSERT — akceptowalny kompromis.

#### 4. RLS — izolacja na poziomie bazy
Każdy select/insert/update/delete jest filtrowany przez polityki RLS w PostgreSQL.  
Nawet jeśli frontend wyśle `SELECT * FROM items` — dostanie tylko swoje wiersze.

Helper function `is_member(hid)` — używana w 5 tabelach żeby nie duplikować subquery.  
`security definer` — funkcja omija RLS household_members (która sprawdza is_member), co byłoby zapętleniem.

#### 5. Invite flow — token w bazie, nie JWT
Link: `/invite/<64-znakowy-hex>`  
Token generuje baza (`encode(gen_random_bytes(32), 'hex')`), nie JavaScript.  
Po użyciu token jest oznaczany (`used_at`) — nie działa ponownie.  
Wygasanie: `expires_at = now() + 7 days` — indeks na `token` dla szybkiego lookup.

#### 6. System Autoryzacji (Magic link, Google, Facebook)
Prostsze UX, bez formularza reset hasła, bez przechowywania haszy.  
Supabase Auth obsługuje logowanie przez email (jednorazowy link z kodem) oraz integrację OAuth (Google, Facebook).  
Mechanizm **Automatic User Linking** łączy konta użytkowników logujących się z tego samego adresu e-mail różnymi metodami.  
`/auth/callback` route wymienia `code` z URL na session cookies.

#### 7. Auto-archiwizacja przez pg_cron
Supabase ma `pg_cron` dostępny w każdym projekcie.  
Codziennie o 3:00 UTC: `UPDATE items SET archived_at = now() WHERE is_bought AND bought_at < now() - 24h`.  
Brak potrzeby Vercel Cron ani zewnętrznego schedulera dla tej funkcji.

---

## Struktura plików

```
zakupy/
├── middleware.ts                     # Auth guard + token refresh
├── supabase/migrations/
│   └── 001_initial.sql              # Cały schemat + RLS + Realtime
└── src/
    ├── lib/
    │   ├── types.ts                  # TypeScript interfaces
    │   └── supabase/
    │       ├── client.ts            # Browser client (Realtime, mutations)
    │       └── server.ts            # Server client (SSR, Server Actions)
    ├── app/
    │   ├── layout.tsx               # Root layout + fonts
    │   ├── auth/
    │   │   ├── login/               # Magic link form
    │   │   └── callback/route.ts   # Code → session exchange
    │   ├── invite/[token]/page.tsx  # Invite acceptance
    │   └── list/page.tsx           # Main page (Server Component)
    └── components/
        ├── ShoppingList.tsx         # Main Client Component + Realtime
        ├── ItemRow.tsx
        ├── AddItemForm.tsx
        ├── CategoryFilter.tsx
        ├── HeaderBar.tsx
        ├── InviteModal.tsx
        └── OnboardingModal.tsx
```

---

## Co to testuje z PetCare architektury

| Feature | PetCare analog |
|---|---|
| Supabase Auth + magic link | Logowanie właścicieli, wolontariuszy |
| RLS per household | RLS per tenant (właściciele prywatni) |
| Realtime INSERT/UPDATE/DELETE | Live aktualizacje kartoteki przy wielu opiekunach |
| Server Component → Client Component handoff | Każda strona z danymi w PetCare |
| Invite token flow | Zapraszanie domowników do konta (sekcja 7.11 PRD) |
| Optimistic updates | Szybkie oznaczanie wizyt, szczepień |
| pg_cron | Codzienne powiadomienia email o terminach |
| Onboarding + seed data | Tworzenie konta organizacji + domyślne ustawienia |

---

## Znane uproszczenia (celowe dla PoC)

- Brak edycji produktu po dodaniu (tylko usuń i dodaj ponownie)
- Brak zarządzania kategoriami z UI (edycja tylko przez SQL)
- Brak testów automatycznych
- Logowanie przez Facebook/Google w środowisku produkcyjnym wymaga weryfikacji domen i aplikacji po stronie dostawców OAuth.

---

## Lokalny build

npm run build

## Lokalny start

npm start