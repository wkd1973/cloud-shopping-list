'use client'

// OnboardingModal — pierwsza wizyta użytkownika.
//
// Użytkownik który nie należy do żadnego gospodarstwa widzi ten modal.
// Dwie opcje:
// 1. Utwórz nowe gospodarstwo (staje się adminem)
// 2. Dołącz przez link — klikając link od kogoś, trafi na /invite/[token]
//    który obsługuje dołączenie bez przechodzenia przez onboarding
//
// Po stworzeniu gospodarstwa:
// - INSERT do households (created_by = user_id)
// - INSERT do household_members (role = 'admin')
// - INSERT domyślnych kategorii
// - Router refresh — Server Component ponownie pobierze dane

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const DEFAULT_CATEGORIES = [
  { name: 'Nabiał',            emoji: '🥛', color: '#3b82f6', sort_order: 0 },
  { name: 'Warzywa i owoce',   emoji: '🥦', color: '#22c55e', sort_order: 1 },
  { name: 'Mięso i ryby',      emoji: '🥩', color: '#ef4444', sort_order: 2 },
  { name: 'Pieczywo',          emoji: '🍞', color: '#f59e0b', sort_order: 3 },
  { name: 'Napoje',            emoji: '🧃', color: '#06b6d4', sort_order: 4 },
  { name: 'Chemia i higiena',  emoji: '🧴', color: '#8b5cf6', sort_order: 5 },
  { name: 'Inne',              emoji: '🛒', color: '#6b7280', sort_order: 6 },
]

interface Props {
  userId:    string
  userEmail: string
}

export default function OnboardingModal({ userId, userEmail }: Props) {
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const supabase = createClient()
  const router   = useRouter()

  async function createHousehold(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    // 1. Utwórz gospodarstwo
    const { data: household, error: hErr } = await supabase
      .from('households')
      .insert({ name: name.trim(), created_by: userId })
      .select('id')
      .single()

    if (hErr || !household) {
      setError('Nie udało się utworzyć gospodarstwa.')
      setLoading(false)
      return
    }

    // 2. Dodaj siebie jako admina
    await supabase.from('household_members').insert({
      household_id:  household.id,
      user_id:       userId,
      display_name:  userEmail.split('@')[0],
      role:          'admin',
    })

    // 3. Seed domyślnych kategorii
    await supabase.from('categories').insert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, household_id: household.id }))
    )

    // 4. Odśwież stronę — Server Component ponownie pobierze dane
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-100">
          Utwórz swoje gospodarstwo
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Nadaj mu nazwę — zobaczą ją wszyscy domownicy
        </p>
      </div>

      <form onSubmit={createHousehold} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="np. Dom Kowalskich, Mieszkanie"
          maxLength={40}
          required
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800
                     text-slate-100 placeholder:text-slate-600
                     focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30
                     transition-all disabled:opacity-50"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400
                     text-slate-950 font-semibold text-sm transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? 'Tworzę…' : 'Utwórz i przejdź do listy'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-600 text-xs">
          Masz już link zaproszenia?{' '}
          <span className="text-slate-500">Kliknij go bezpośrednio — dołączysz automatycznie.</span>
        </p>
      </div>
    </div>
  )
}
