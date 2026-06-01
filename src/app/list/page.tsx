// /list — ekran wyboru listy zakupów
// Pokazuje wszystkie aktywne listy gospodarstwa jako kafelki.
// Stąd użytkownik wchodzi w konkretną listę lub tworzy nową.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingModal from '@/components/OnboardingModal'
import ListsScreen from '@/components/ListsScreen'
import type { ShoppingList } from '@/lib/types'

interface Props {
  searchParams: Promise<{ householdId?: string }>
}

export default async function ListsPage(props: Props) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id, role, households(id, name)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (!memberships || memberships.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <OnboardingModal userId={user.id} userEmail={user.email!} />
      </main>
    )
  }

  // Znajdź wybrane domostwo (z URL) lub ustaw domyślne (priorytet dla roli 'admin')
  const selectedHouseholdId = searchParams.householdId
  const defaultMembership = memberships.find(m => m.role === 'admin') ?? memberships[0]
  
  const activeMembership = selectedHouseholdId 
    ? memberships.find(m => m.household_id === selectedHouseholdId) ?? defaultMembership
    : defaultMembership

  const householdId = activeMembership.household_id
  const household   = activeMembership.households as unknown as { id: string; name: string }

  // Map memberships for the UI dropdown
  const userHouseholds = memberships.map(m => ({
    id: m.household_id,
    name: (m.households as unknown as { id: string; name: string }).name,
    role: m.role
  }))

  // Pobierz listy + liczbę aktywnych produktów na każdej
  const { data: lists } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('household_id', householdId)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  // Policz aktywne produkty per lista
  const { data: counts } = await supabase
    .from('items')
    .select('list_id')
    .eq('household_id', householdId)
    .is('archived_at', null)
    .eq('is_bought', false)

  const countMap = (counts ?? []).reduce<Record<string, number>>((acc, item) => {
    if (item.list_id) acc[item.list_id] = (acc[item.list_id] ?? 0) + 1
    return acc
  }, {})

  const listsWithCount: ShoppingList[] = (lists ?? []).map(l => ({
    ...l,
    item_count: countMap[l.id] ?? 0,
  }))

  return (
    <ListsScreen
      key={householdId}
      lists={listsWithCount}
      householdId={householdId}
      householdName={household.name}
      userHouseholds={userHouseholds}
      userId={user.id}
      userEmail={user.email!}
      isAdmin={activeMembership.role === 'admin'}
    />
  )
}
