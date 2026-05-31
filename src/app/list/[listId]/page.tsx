// /list/[listId] — konkretna lista zakupów
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ShoppingList from '@/components/ShoppingList'
import type { Category, Item } from '@/lib/types'

interface Props { params: Promise<{ listId: string }> }

export default async function ListPage(props: Props) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Pobierz listę (weryfikacja że należy do tego gospodarstwa zapewniona przez RLS)
  const { data: shoppingList } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', params.listId)
    .is('archived_at', null)
    .single()

  if (!shoppingList) notFound()

  const householdId = shoppingList.household_id

  // Pobierz rolę użytkownika w tym gospodarstwie
  const { data: membership } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/list')

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from('categories').select('*').eq('household_id', householdId).order('sort_order'),
    supabase.from('items').select('*, category:categories(*)').eq('list_id', params.listId).is('archived_at', null).order('created_at', { ascending: false }),
  ])

  return (
    <ShoppingList
      initialItems={(items ?? []) as Item[]}
      categories={(categories ?? []) as Category[]}
      householdId={householdId}
      listId={params.listId}
      listName={shoppingList.name}
      listEmoji={shoppingList.emoji}
      userId={user.id}
      userEmail={user.email!}
      isAdmin={membership.role === 'admin'}
    />
  )
}
