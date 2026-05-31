'use client'

// IOSInstallBanner — specjalny przypadek iOS.
//
// Na iOS Push API jest dostępne TYLKO gdy aplikacja jest zainstalowana jako PWA
// (Add to Home Screen / A2HS). Na zwykłej stronie w Safari push nie działa.
//
// Ten baner wykrywa: iOS + Safari + nie zainstalowane jako PWA
// i pokazuje instrukcję instalacji ZANIM użytkownik zobaczy PushButton.
//
// Dlaczego to ważne dla PetCare?
// iOS Safari nie wspiera `beforeinstallprompt` — nie ma natywnego prompta.
// Jedyna opcja to banner z instrukcją "Stuknij ⬆️ → Dodaj do ekranu głównego".
// Bez tego użytkownicy iOS nigdy nie dostają powiadomień push.

import { useEffect, useState } from 'react'

function isIOS() {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

const DISMISSED_KEY = 'ios-install-banner-dismissed'

export default function IOSInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed && isIOS() && !isInStandaloneMode()) {
      // Małe opóźnienie — nie atakuj użytkownika przy pierwszym załadowaniu
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 max-w-sm mx-auto">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">📲</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200">
              Zainstaluj aplikację
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Żeby włączyć powiadomienia push na iPhone, dodaj aplikację do ekranu głównego:
              stuknij{' '}
              <span className="text-slate-300">
                ⬆️ → „Dodaj do ekranu głównego"
              </span>
            </p>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
