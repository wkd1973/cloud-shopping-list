'use client'

// usePushNotifications — hook zarządzający cyklem życia Web Push.
//
// Stany:
//   unsupported  → przeglądarka nie obsługuje Push API (Safari < 16.4, stary Android)
//   denied       → użytkownik zablokował uprawnienia (nie pokazuj ponownie)
//   default      → nie pytano jeszcze (pokaż przycisk "Włącz powiadomienia")
//   subscribed   → aktywna subskrypcja zapisana w bazie
//   loading      → trwa operacja (subskrypcja lub odsubskrypcja)
//
// UWAGA iOS:
// Safari na iOS wymaga żeby aplikacja była zainstalowana jako PWA (A2HS)
// zanim Push API będzie dostępne. Na "zwykłej" stronie w Safari Push nie działa.
// Dlatego warto pokazać użytkownikowi banner "Zainstaluj aplikację" przed prośbą o push.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type PushStatus = 'unsupported' | 'denied' | 'default' | 'subscribed' | 'loading'

// VAPID public key musi być dostępny po stronie klienta
// (NEXT_PUBLIC_ prefix — trafia do bundle)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

// Konwersja base64url → Uint8Array (wymagane przez PushManager.subscribe)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding  = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications(householdId: string) {
  const [status, setStatus]   = useState<PushStatus>('loading')
  const [error, setError]     = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    const permission = Notification.permission
    if (permission === 'denied') { setStatus('denied');  return }
    if (permission === 'default') { setStatus('default'); return }

    // Sprawdź czy mamy już aktywną subskrypcję
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        setStatus('subscribed')
      } else {
        setStatus('default')
      }
    })
  }, [])

  async function subscribe() {
    setStatus('loading')
    setError(null)

    try {
      // 1. Poproś o uprawnienia
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'default')
        return
      }

      // 2. Zarejestruj subskrypcję w przeglądarce
      const reg          = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,          // wymagane — push musi być widoczny
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
      })

      // 3. Wyciągnij klucze z subskrypcji
      const subJSON = subscription.toJSON()
      const keys    = subJSON.keys as { p256dh: string; auth: string }

      // 4. Zapisz endpoint + klucze w Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Brak sesji')

      const { error: dbErr } = await supabase
        .from('push_subscriptions')
        .upsert(                             // upsert — nie duplikuj jeśli endpoint istnieje
          {
            user_id:      user.id,
            household_id: householdId,
            endpoint:     subscription.endpoint,
            p256dh:       keys.p256dh,
            auth_key:     keys.auth,
            user_agent:   navigator.userAgent,
          },
          { onConflict: 'endpoint' }         // klucz deduplikacji
        )

      if (dbErr) throw dbErr

      setStatus('subscribed')
    } catch (err) {
      console.error('Push subscribe error:', err)
      setError(err instanceof Error ? err.message : 'Nie udało się włączyć powiadomień')
      setStatus('default')
    }
  }

  async function unsubscribe() {
    setStatus('loading')

    try {
      const reg          = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.getSubscription()

      if (subscription) {
        // 1. Usuń z przeglądarki
        await subscription.unsubscribe()

        // 2. Usuń z bazy
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint)
      }

      setStatus('default')
    } catch (err) {
      console.error('Push unsubscribe error:', err)
      setStatus('subscribed') // rollback
    }
  }

  return { status, error, subscribe, unsubscribe }
}
