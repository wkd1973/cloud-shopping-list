// Server Component — renderuje formularz logowania.
// Używa Supabase Auth z magic link (email OTP) — prościej niż hasło,
// bez konieczności pamiętania haseł i obsługi resetu.
// Można łatwo dodać OAuth (Google) jeśli potrzeba.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

interface Props {
  searchParams: { redirectTo?: string; error?: string }
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Już zalogowany — idź do listy
  if (user) redirect(searchParams.redirectTo ?? '/list')

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
            Zakupy
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Lista zakupów dla całego domu
          </p>
        </div>

        <LoginForm
          redirectTo={searchParams.redirectTo}
          error={searchParams.error}
        />
      </div>
    </main>
  )
}
