'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  redirectTo?: string
  error?: string
}

export default function LoginForm({ redirectTo, error }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState(error ?? '')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    // Magic link — Supabase wysyła email z linkiem jednorazowym.
    // Po kliknięciu użytkownik trafia na /auth/callback który wymienia
    // kod na sesję i redirectuje do właściwej strony.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo ?? '/list'}`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <div className="text-3xl mb-3">📬</div>
        <p className="text-slate-200 font-medium">Sprawdź skrzynkę</p>
        <p className="text-slate-500 text-sm mt-1">
          Wysłaliśmy link logowania na <span className="text-slate-300">{email}</span>
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Wróć
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="twoj@email.pl"
          required
          disabled={status === 'loading'}
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100
                     placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60
                     focus:ring-1 focus:ring-emerald-500/30 transition-all
                     disabled:opacity-50"
        />
      </div>

      {errorMsg && (
        <p className="text-red-400 text-sm px-1">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !email.trim()}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400
                   text-slate-950 font-semibold text-sm transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   active:scale-[0.98]"
      >
        {status === 'loading' ? 'Wysyłam…' : 'Wyślij link logowania'}
      </button>

      <p className="text-center text-slate-600 text-xs pt-1">
        Link ważny przez 24 godziny · Bez hasła
      </p>
    </form>
  )
}
