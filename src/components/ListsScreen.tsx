'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ShoppingList } from '@/lib/types'
import InviteModal from './InviteModal'
import MembersModal from './MembersModal'
import { APP_VERSION } from '@/lib/version'

const EMOJIS = ['🛒','🎄','🎁','🏠','🍕','🧹','💊','🐾','📦','✈️','🎂','🛠️']

interface UserHousehold {
  id: string
  name: string
  role: string
}

interface Props {
  lists:         ShoppingList[]
  householdId:   string
  householdName: string
  userHouseholds: UserHousehold[]
  userId:        string
  userEmail:     string
  isAdmin:       boolean
}

export default function ListsScreen({ lists: initialLists, householdId, householdName, userHouseholds, userId, userEmail, isAdmin }: Props) {
  const [lists, setLists]           = useState(initialLists)
  const [showNew, setShowNew]       = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newEmoji, setNewEmoji]     = useState('🛒')
  const [loading, setLoading]       = useState(false)
  const [showMenu, setShowMenu]     = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  async function createList(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('shopping_lists')
      .insert({ household_id: householdId, name: newName.trim(), emoji: newEmoji, created_by: userId })
      .select('*')
      .single()

    if (!error && data) {
      setLists(prev => [...prev, { ...data, item_count: 0 }])
      setNewName('')
      setNewEmoji('🛒')
      setShowNew(false)
      router.push(`/list/${data.id}`)
    }
    setLoading(false)
  }

  async function archiveList(id: string) {
    await supabase.from('shopping_lists').update({ archived_at: new Date().toISOString() }).eq('id', id)
    setLists(prev => prev.filter(l => l.id !== id))
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <span className="text-xl">🏠</span>
          <div className="flex-1 min-w-0">
            {userHouseholds.length > 1 ? (
              <select 
                value={householdId}
                onChange={(e) => router.push(`/list?householdId=${e.target.value}`)}
                className="block w-auto text-sm font-semibold text-gray-800 bg-transparent border-none p-0 pr-6 focus:ring-0 truncate cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_center]"
              >
                {userHouseholds.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            ) : (
              <h1 className="text-sm font-semibold text-gray-800 truncate">{householdName}</h1>
            )}
            <p className="text-xs text-gray-400">{lists.length} {lists.length === 1 ? 'lista' : 'listy'}</p>
          </div>

          {isAdmin && (
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200 transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Zaproś
            </button>
          )}

          <div className="relative">
            <button onClick={() => setShowMenu(m => !m)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-30 w-52 max-h-[80vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1 origin-top-right animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                  </div>
                  
                  <div className="h-px bg-gray-100 my-1" />
                  
                  <button onClick={() => { setShowMenu(false); setShowMembers(true); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    Członkowie domostwa
                  </button>
                  
                  <div className="h-px bg-gray-100 my-1" />

                  <button onClick={() => { setShowMenu(false); router.push('/help'); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    Pomoc i informacje
                  </button>
                  <button onClick={() => { setShowMenu(false); router.push('/terms'); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    Regulamin
                  </button>
                  <button onClick={() => { setShowMenu(false); router.push('/privacy'); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">policy</span>
                    Polityka Prywatności
                  </button>
                  
                  <div className="h-px bg-gray-100 my-1" />

                  <button onClick={signOut} className="w-full text-left px-3 py-2 text-[14px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Wyloguj się
                  </button>

                  <div className="h-px bg-gray-100 my-1" />
                  <div className="px-3 py-1.5 text-center flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono text-gray-400">Wersja {APP_VERSION}</span>
                    <span className="text-[10px] text-gray-400">Stworzone przez <a href="https://github.com/wkd1973" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">Wojciecha Dobrowolskiego</a></span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Kafelki list */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lists.map(list => (
            <button key={list.id}
              onClick={() => router.push(`/list/${list.id}`)}
              className="group relative bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-emerald-300 hover:shadow-sm transition-all active:scale-[0.98]"
            >
              <div className="text-3xl mb-3">{list.emoji}</div>
              <div className="text-sm font-semibold text-gray-800 truncate">{list.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {list.item_count === 0 ? 'Pusta' : `${list.item_count} do kupienia`}
              </div>

              {/* Usuń — pojawia się na hover */}
              {isAdmin && (
                <button
                  onClick={e => { e.stopPropagation(); archiveList(list.id) }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </button>
          ))}

          {/* Dodaj nową listę */}
          <button onClick={() => setShowNew(true)}
            className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4 text-left hover:border-emerald-300 hover:bg-emerald-50/30 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2 min-h-[120px]"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg">+</div>
            <span className="text-xs text-gray-400 font-medium">Nowa lista</span>
          </button>
        </div>
      </div>

      {/* Modal nowej listy */}
      {showNew && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 max-w-sm mx-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Nowa lista zakupów</h2>

            <form onSubmit={createList} className="space-y-4">
              {/* Wybór emoji */}
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(em => (
                  <button key={em} type="button" onClick={() => setNewEmoji(em)}
                    className={`w-9 h-9 rounded-xl text-xl transition-all
                      ${newEmoji === em ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Nazwa listy…" maxLength={40} required autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-all"
                >
                  Anuluj
                </button>
                <button type="submit" disabled={loading || !newName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all disabled:opacity-50 active:scale-95"
                >
                  {loading ? 'Tworzę…' : 'Utwórz'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {showInvite && <InviteModal householdId={householdId} onClose={() => setShowInvite(false)} />}
      {showMembers && <MembersModal householdId={householdId} onClose={() => setShowMembers(false)} />}
    </div>
  )
}
