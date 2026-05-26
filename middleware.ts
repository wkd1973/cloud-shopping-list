// middleware.ts — uruchamia się przed każdym requestem
//
// Dwa zadania:
// 1. Odświeżanie tokenów Supabase (access token wygasa po 1h)
//    Bez tego użytkownik byłby wylogowywany co godzinę.
// 2. Ochrona routów — redirect do /auth/login gdy brak sesji.
//
// WAŻNE: middleware działa w Edge Runtime (V8 isolate, nie Node.js),
// więc nie ma dostępu do fs, crypto Node.js itp.
// createServerClient z @supabase/ssr to obsługuje poprawnie.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Odśwież sesję (wywołanie getUser() triggeruje refresh jeśli potrzebny)
  const { data: { user } } = await supabase.auth.getUser()

  // Chronione ścieżki — wymagają zalogowania
  const protectedPaths = ['/list', '/onboarding']
  const isProtected = protectedPaths.some(p =>
    request.nextUrl.pathname.startsWith(p)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Zalogowany na stronie logowania → idź do listy
  if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/list'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Pomijamy: _next/static, _next/image, favicon, pliki statyczne
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
