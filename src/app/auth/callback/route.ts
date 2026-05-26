// Route Handler (nie Page) — wymienia jednorazowy kod z URL na sesję.
//
// Supabase magic link wygląda tak:
//   https://twojadomena.pl/auth/callback?code=abc123&redirectTo=/list
//
// Ten handler woła exchangeCodeForSession(), które:
// 1. Wysyła kod do Supabase Auth
// 2. Dostaje access_token + refresh_token
// 3. Zapisuje je w cookies (httpOnly, secure)
// 4. Redirectuje użytkownika do właściwej strony
//
// Dlaczego Route Handler, nie Page?
// Callback to operacja serwera (ustawianie cookies) — nie ma sensu
// renderować HTML tylko po to żeby od razu redirectować.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/list'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Błąd — wróć do logowania z komunikatem
  return NextResponse.redirect(
    `${origin}/auth/login?error=Link+wygasł+lub+jest+nieprawidłowy`
  )
}
