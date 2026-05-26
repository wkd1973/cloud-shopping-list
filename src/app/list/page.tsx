// Server Component — główna strona listy zakupów.
//
// Odpowiada za:
// 1. Weryfikację sesji (middleware już to robi, ale defensywne sprawdzenie jest OK)
// 2. Pobranie danych z Supabase (SSR — pierwsze renderowanie bez waterfall)
// 3. Przekazanie danych do Client Component ShoppingList
//
// Dane pobieramy tu, w Server Component, bo:
// - Brak dodatkowego round-trip przeglądarki
// - Klucze API nie wychodzą do klienta
// - Strona renderuje się z danymi od razu (no loading flash)
//
// Po pierwszym renderowaniu ShoppingList przejmuje kontrolę i
// subskrybuje Realtime — dalsze zmiany wpadają bez przeładowania strony.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShoppingList from '@/components/ShoppingList'
import OnboardingModal from '@/components/OnboardingModal'
import type { Category, Item } from '@/lib/types'

export default async function ListPage() {
  const supabase = await createClient()

  // Pobierz zalogowanego użytkownika
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Pobierz gospodarstwo użytkownika (pierwsze znalezione)
  // W v2 można obsłużyć wiele gospodarstw z przełącznikiem
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role, households(id, name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  // Użytkownik bez gospodarstwa — pokaż onboarding
  if (!membership) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <OnboardingModal userId={user.id} userEmail={user.email!} />
      </main>
    )
  }

  const householdId = membership.household_id
  const household = membership.households as { id: string; name: string }

  // Pobierz kategorie i aktywne produkty równolegle (Promise.all = brak waterfall)
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('household_id', householdId)
      .order('sort_order'),

    supabase
      .from('items')
      .select('*, category:categories(*)')
      .eq('household_id', householdId)
      .is('archived_at', null)           // tylko aktywne (nie archiwum)
      .order('created_at', { ascending: false }),
  ])

  return (
    <ShoppingList
      initialItems={(items ?? []) as Item[]}
      categories={(categories ?? []) as Category[]}
      householdId={householdId}
      householdName={household.name}
      userId={user.id}
      userEmail={user.email!}
      isAdmin={membership.role === 'admin'}
    />
  )
}
