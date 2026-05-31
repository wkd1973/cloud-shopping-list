'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import InviteModal from './InviteModal'
import MembersModal from './MembersModal'
import PushButton from './PushButton'

interface Props {
  householdName: string
  householdId:   string
  userEmail:     string
  isAdmin:       boolean
  totalCount:    number
  boughtCount:   number
}

export default function HeaderBar({ householdName, householdId, userEmail, isAdmin, totalCount, boughtCount }: Props) {
  const [showInvite, setShowInvite] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showMenu, setShowMenu]     = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  const progress = totalCount > 0 ? (boughtCount / totalCount) * 100 : 0

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <span className="text-xl">🛒</span>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-800 truncate">{householdName}</h1>
            <p className="text-xs text-gray-400">{boughtCount} / {totalCount} produktów</p>
          </div>

          <PushButton householdId={householdId} />

          {isAdmin && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium
                         border border-emerald-200 transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Zaproś
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(m => !m)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); setShowMembers(true); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-100"
                  >
                    Członkowie domostwa
                  </button>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    Wyloguj się
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {totalCount > 0 && (
          <div className="h-0.5 bg-gray-100">
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      {showInvite && <InviteModal householdId={householdId} onClose={() => setShowInvite(false)} />}
      {showMembers && <MembersModal householdId={householdId} onClose={() => setShowMembers(false)} />}
    </>
  )
}
