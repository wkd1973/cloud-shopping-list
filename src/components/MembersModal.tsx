'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { HouseholdMember } from '@/lib/types'

interface Props { 
  householdId: string
  onClose: () => void 
}

export default function MembersModal({ householdId, onClose }: Props) {
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', householdId)
        .order('joined_at', { ascending: true })
      
      if (data) {
        setMembers(data as HouseholdMember[])
      }
      setLoading(false)
    }
    fetchMembers()
  }, [householdId])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 max-w-sm mx-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-start justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Członkowie domostwa</h2>
            <p className="text-xs text-gray-400 mt-0.5">Osoby mające dostęp do tej listy</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 -mr-1 space-y-3">
          {loading ? (
            <div className="py-8 flex justify-center">
              <svg className="animate-spin h-6 w-6 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            members.map((member) => {
              const displayName = member.display_name || 'Użytkownik'
              const initial = displayName.charAt(0).toUpperCase()
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{member.role === 'admin' ? 'Administrator' : 'Członek'}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
