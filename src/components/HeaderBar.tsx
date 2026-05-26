'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import InviteModal from './InviteModal'

interface Props {
  householdName: string
  householdId:   string
  userEmail:     string
  isAdmin:       boolean
  totalCount:    number
  boughtCount:   number
}

export default function HeaderBar({
  householdName, householdId, userEmail, isAdmin, totalCount, boughtCount
}: Props) {
  const [showInvite, setShowInvite]   = useState(false)
  const [showMenu, setShowMenu]       = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  const progress = totalCount > 0 ? (boughtCount / totalCount) * 100 : 0

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <span className="text-xl">🛒</span>

          {/* Household name */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-200 truncate">
              {householdName}
            </h1>
            <p className="text-xs text-slate-600">
              {boughtCount} / {totalCount} produktów
            </p>
          </div>

          {/* Zaproś */}
          {isAdmin && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs
                         transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Zaproś
            </button>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(m => !m)}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-slate-500 hover:text-slate-300 hover:bg-slate-800
                         transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-3 py-2.5 text-sm text-slate-400
                               hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Wyloguj się
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="h-0.5 bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {showInvite && (
        <InviteModal
          householdId={householdId}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  )
}
