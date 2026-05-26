'use client'

// ShoppingList — główny Client Component z Realtime.
//
// KLUCZOWA DECYZJA ARCHITEKTONICZNA:
// Supabase Realtime działa przez WebSocket — tylko w przeglądarce.
// Dlatego ten komponent jest Client Component ('use client').
//
// Wzorzec: Server Component pobiera dane → przekazuje jako props →
// Client Component inicjuje stan z tych props → subskrybuje Realtime →
// dalsze zmiany przychodzą przez WebSocket bez przeładowania.
//
// Dzięki temu:
// - Pierwsza wizyta: dane od razu w HTML (SSR, brak flash)
// - Kolejne zmiany: live, bez pollingu

import { useEffect, useOptimistic, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Item } from '@/lib/types'
import ItemRow from './ItemRow'
import AddItemForm from './AddItemForm'
import CategoryFilter from './CategoryFilter'
import HeaderBar from './HeaderBar'

interface Props {
  initialItems:   Item[]
  categories:     Category[]
  householdId:    string
  householdName:  string
  userId:         string
  userEmail:      string
  isAdmin:        boolean
}

export default function ShoppingList({
  initialItems,
  categories,
  householdId,
  householdName,
  userId,
  userEmail,
  isAdmin,
}: Props) {
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>(initialItems)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [showBought, setShowBought] = useState(false)
  const [, startTransition] = useTransition()

  // Optimistic updates — UI odpowiada natychmiast, nie czeka na serwer
  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (state: Item[], update: { type: 'add' | 'toggle' | 'delete'; item?: Item; id?: string }) => {
      switch (update.type) {
        case 'add':
          return [update.item!, ...state]
        case 'toggle':
          return state.map(i =>
            i.id === update.id
              ? { ...i, is_bought: !i.is_bought, bought_at: new Date().toISOString(), bought_by: userId }
              : i
          )
        case 'delete':
          return state.filter(i => i.id !== update.id)
        default:
          return state
      }
    }
  )

  // ── Realtime subscription ────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`household:${householdId}`)  // nazwa kanału = scope
      .on(
        'postgres_changes',
        {
          event:  '*',           // INSERT | UPDATE | DELETE
          schema: 'public',
          table:  'items',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload) => {
          // Realtime dostarcza diff — nie pełny obiekt z JOIN-ami.
          // Przy INSERT pobieramy pełny rekord z kategoriami.
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('items')
              .select('*, category:categories(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setItems(prev => {
                // Deduplikacja — optimistic update mógł już dodać
                if (prev.some(i => i.id === data.id)) return prev
                return [data as Item, ...prev]
              })
            }
          }

          if (payload.eventType === 'UPDATE') {
            setItems(prev =>
              prev.map(i =>
                i.id === payload.new.id ? { ...i, ...payload.new } : i
              )
            )
          }

          if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // Cleanup — unsubscribe przy odmontowaniu lub zmianie householdId
    return () => { supabase.removeChannel(channel) }
  }, [householdId, supabase])

  // ── Akcje ────────────────────────────────────────────────

  async function addItem(name: string, quantity: string, categoryId: string | null) {
    const tempId = crypto.randomUUID()

    // Optimistic — dodaj od razu do UI
    const optimisticItem: Item = {
      id:           tempId,
      household_id: householdId,
      category_id:  categoryId,
      name,
      quantity:     quantity || null,
      note:         null,
      added_by:     userId,
      is_bought:    false,
      bought_by:    null,
      bought_at:    null,
      archived_at:  null,
      created_at:   new Date().toISOString(),
      category:     categories.find(c => c.id === categoryId) ?? null,
    }

    startTransition(() => {
      addOptimistic({ type: 'add', item: optimisticItem })
    })

    // Zapis do bazy — Realtime wyśle INSERT z powrotem,
    // setItems deduplikuje na podstawie id
    const { error } = await supabase.from('items').insert({
      household_id: householdId,
      category_id:  categoryId,
      name,
      quantity:     quantity || null,
      added_by:     userId,
    })

    if (error) {
      // Rollback — usuń optimistic item
      setItems(prev => prev.filter(i => i.id !== tempId))
      console.error('Błąd dodawania:', error)
    }
  }

  async function toggleItem(id: string) {
    const item = items.find(i => i.id === id)
    if (!item) return

    startTransition(() => {
      addOptimistic({ type: 'toggle', id })
    })

    const { error } = await supabase
      .from('items')
      .update({
        is_bought:  !item.is_bought,
        bought_by:  !item.is_bought ? userId : null,
        bought_at:  !item.is_bought ? new Date().toISOString() : null,
      })
      .eq('id', id)

    if (error) {
      // Rollback
      setItems(prev =>
        prev.map(i => i.id === id ? item : i)
      )
    }
  }

  async function deleteItem(id: string) {
    startTransition(() => {
      addOptimistic({ type: 'delete', id })
    })

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (error) {
      // Rollback — przywróć item
      const item = items.find(i => i.id === id)
      if (item) setItems(prev => [...prev, item])
    }
  }

  // ── Filtrowanie i grupowanie ─────────────────────────────

  const activeItems = optimisticItems.filter(i =>
    !i.is_bought &&
    i.archived_at === null &&
    (filterCategory === null || i.category_id === filterCategory)
  )

  const boughtItems = optimisticItems.filter(i =>
    i.is_bought && i.archived_at === null
  )

  const totalCount  = optimisticItems.filter(i => !i.archived_at).length
  const boughtCount = boughtItems.length

  // Grupuj aktywne produkty po kategorii
  const grouped = categories.reduce<Record<string, Item[]>>((acc, cat) => {
    const catItems = activeItems.filter(i => i.category_id === cat.id)
    if (catItems.length > 0) acc[cat.id] = catItems
    return acc
  }, {})
  const uncategorized = activeItems.filter(i => !i.category_id)

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <HeaderBar
        householdName={householdName}
        householdId={householdId}
        userEmail={userEmail}
        isAdmin={isAdmin}
        totalCount={totalCount}
        boughtCount={boughtCount}
      />

      <div className="max-w-2xl mx-auto px-4 pb-24 pt-4">
        {/* Filtr kategorii */}
        <CategoryFilter
          categories={categories}
          activeCategory={filterCategory}
          onSelect={setFilterCategory}
        />

        {/* Formularz dodawania */}
        <AddItemForm
          categories={categories}
          defaultCategoryId={filterCategory}
          onAdd={addItem}
        />

        {/* Lista aktywnych produktów */}
        <div className="mt-6 space-y-4">
          {/* Niekategoryzowane */}
          {uncategorized.length > 0 && (
            <div className="space-y-1">
              {uncategorized.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}

          {/* Per kategoria */}
          {categories.map(cat => {
            const catItems = grouped[cat.id]
            if (!catItems) return null
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{cat.emoji}</span>
                  <span
                    className="text-xs font-medium tracking-wide uppercase"
                    style={{ color: cat.color }}
                  >
                    {cat.name}
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-xs text-slate-600">{catItems.length}</span>
                </div>
                <div className="space-y-1">
                  {catItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {activeItems.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-sm">Lista pusta — wszystko kupione?</p>
            </div>
          )}
        </div>

        {/* Kupione — collapsible */}
        {boughtItems.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowBought(b => !b)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400 transition-colors w-full"
            >
              <div className="flex-1 h-px bg-slate-800" />
              <span>Kupione ({boughtCount})</span>
              <span className="transition-transform" style={{ transform: showBought ? 'rotate(180deg)' : '' }}>
                ▾
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </button>

            {showBought && (
              <div className="mt-3 space-y-1">
                {boughtItems.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
