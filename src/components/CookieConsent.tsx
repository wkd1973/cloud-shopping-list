'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  function accept() {
    localStorage.setItem('cookie-consent', 'true')
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none">
      <div className="max-w-screen-sm mx-auto bg-surface-container-highest border border-outline-variant rounded-2xl p-4 shadow-xl pointer-events-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center animate-in slide-in-from-bottom-5 duration-500">
        <div className="flex-1 text-[13px] text-on-surface leading-relaxed">
          <strong>Szanujemy Twoją prywatność.</strong> Nasza aplikacja używa wyłącznie niezbędnych plików cookie (tzw. sesyjnych) do utrzymania bezpiecznego logowania oraz lokalnej pamięci (PWA) do przyspieszenia działania. Nie śledzimy Cię w celach reklamowych. Więcej informacji w naszej <Link href="/privacy" className="text-primary hover:underline font-bold">Polityce Prywatności</Link>.
        </div>
        <button 
          onClick={accept}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-[14px] hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
        >
          Rozumiem i akceptuję
        </button>
      </div>
    </div>
  )
}
