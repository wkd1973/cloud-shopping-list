// Klient Supabase dla komponentów po stronie przeglądarki (Client Components).
// Utrzymuje persystentną sesję użytkownika w localStorage/cookies.
//
// WAŻNE: createBrowserClient z @supabase/ssr to nie to samo co
// createClient z @supabase/supabase-js — ten pierwszy poprawnie
// synchronizuje sesję między kartami i obsługuje token refresh.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
