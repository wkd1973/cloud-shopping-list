'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props { householdId: string; onClose: () => void }

export default function InviteModal({ householdId, onClose }: Props) {
  const [status, setStatus]       = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied]       = useState(false)
  const supabase = createClient()

  async function generateLink() {
    setStatus('loading')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('household_invites').insert({ household_id: householdId, created_by: user.id }).select('token').single()
    if (error || !data) { setStatus('error'); return }
    setInviteUrl(`${window.location.origin}/invite/${data.token}`)
    setStatus('done')
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 max-w-sm mx-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Zaproś domownika</h2>
            <p className="text-xs text-gray-400 mt-0.5">Link ważny 7 dni · Jednorazowy</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'idle' && (
          <button onClick={generateLink}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all active:scale-95"
          >
            Generuj link zaproszenia
          </button>
        )}
        {status === 'loading' && <div className="py-2.5 text-center text-sm text-gray-400">Generuję…</div>}
        {status === 'done' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="flex-1 text-xs text-gray-500 font-mono truncate">{inviteUrl}</span>
            </div>
            <button onClick={copyToClipboard}
              className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95
                ${copied ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
            >
              {copied ? '✓ Skopiowano!' : 'Kopiuj link'}
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-red-500">Nie udało się wygenerować linku.</p>
            <button onClick={() => setStatus('idle')} className="text-sm text-gray-400 hover:text-gray-600">Spróbuj ponownie</button>
          </div>
        )}
      </div>
    </>
  )
}
