// Klient Supabase dla Server Components i Server Actions.
// Każde wywołanie tworzy nową instancję — to jest właściwe zachowanie,
// bo cookies są per-request (Next.js nie współdzieli kontekstu między requestami).
//
// createServerClient z @supabase/ssr odczytuje i zapisuje cookies,
// dzięki czemu token refresh działa poprawnie w Server Components.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string, value: string, options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll w Server Component rzuca błąd — to OK,
            // middleware obsługuje refresh tokenów
          }
        },
      },
    }
  )
}
