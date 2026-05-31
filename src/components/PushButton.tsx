'use client'

// PushButton — przycisk włączania/wyłączania powiadomień push.
// Używa hooka usePushNotifications — cała logika tam.
//
// Pokazywany w HeaderBar obok przycisku "Zaproś".
// Celowo dyskretny — nie blokuje onboardingu, nie wyskakuje z modalem.
// Użytkownik widzi go i może kliknąć gdy jest gotowy.

import { usePushNotifications } from '@/hooks/usePushNotifications'

interface Props {
  householdId: string
}

export default function PushButton({ householdId }: Props) {
  const { status, subscribe, unsubscribe } = usePushNotifications(householdId)

  // Nie renderuj jeśli przeglądarka nie obsługuje lub użytkownik zablokował
  if (status === 'unsupported' || status === 'denied') return null

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full border border-slate-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (status === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        title="Wyłącz powiadomienia"
        className="w-8 h-8 rounded-lg flex items-center justify-center
                   text-emerald-400 hover:text-slate-400 hover:bg-slate-800
                   transition-colors"
      >
        {/* Bell z wypełnieniem = włączone */}
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
      </button>
    )
  }

  // status === 'default' — pokaż przycisk włączania
  return (
    <button
      onClick={subscribe}
      title="Włącz powiadomienia"
      className="w-8 h-8 rounded-lg flex items-center justify-center
                 text-slate-600 hover:text-slate-300 hover:bg-slate-800
                 transition-colors"
    >
      {/* Bell outline = wyłączone */}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </button>
  )
}
