'use client'

// InviteModal — generuje token zaproszenia i tworzy link do skopiowania.
//
// Flow:
// 1. Admin otwiera modal
// 2. Klikamy "Generuj link" → insert do household_invites
// 3. Kopiujemy link do schowka
// 4. Zaproszony klika link → /invite/[token] → dołącza do gospodarstwa
//
// Token generuje baza (encode(gen_random_bytes(32), 'hex')),
// nie frontend — bezpieczniej i prościej.

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  householdId: string
  onClose:     () => void
}

export default function InviteModal({ householdId, onClose }: Props) {
  const [status, setStatus]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied]     = useState(false)
  const supabase = createClient()

  async function generateLink() {
    setStatus('loading')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Insert — baza wygeneruje token automatycznie (default w SQL)
    const { data, error } = await supabase
      .from('household_invites')
      .insert({ household_id: householdId, created_by: user.id })
      .select('token')
      .single()

    if (error || !data) {
      setStatus('error')
      return
    }

    const url = `${window.location.origin}/invite/${data.token}`
    setInviteUrl(url)
    setStatus('done')
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 max-w-sm mx-auto
                      rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Zaproś domownika</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Link ważny 7 dni · Jednorazowy
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'idle' && (
          <button
            onClick={generateLink}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400
                       text-slate-950 font-semibold text-sm transition-all active:scale-95"
          >
            Generuj link zaproszenia
          </button>
        )}

        {status === 'loading' && (
          <div className="py-2.5 text-center text-sm text-slate-500">
            Generuję…
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="flex-1 text-xs text-slate-400 font-mono truncate">
                {inviteUrl}
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className={`
                w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95
                ${copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }
              `}
            >
              {copied ? '✓ Skopiowano!' : 'Kopiuj link'}
            </button>
            <p className="text-xs text-slate-600 text-center">
              Możesz też wysłać ten link przez SMS lub komunikator
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-red-400">Nie udało się wygenerować linku.</p>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}
      </div>
    </>
  )
}
