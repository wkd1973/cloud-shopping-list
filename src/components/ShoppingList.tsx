'use client'

import { useEffect, useOptimistic, useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category, Item, FrequentItem } from '@/lib/types'
import ItemRow from './ItemRow'
import AddItemForm from './AddItemForm'
import CategoryFilter from './CategoryFilter'
import MembersModal from './MembersModal'
import PresetsCarousel from './PresetsCarousel'
import type { Preset } from '@/lib/types'

interface Props {
  initialItems:  Item[]
  categories:    Category[]
  frequentItems: FrequentItem[]
  presets:       Preset[]
  householdId:   string
  listId:        string
  listName:      string
  listEmoji:     string
  userId:        string
  userEmail:     string
  isAdmin:       boolean
}

export default function ShoppingList({ initialItems, categories, frequentItems, presets: initialPresets, householdId, listId, listName, listEmoji, userId, userEmail, isAdmin }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [items, setItems]                   = useState<Item[]>(initialItems)
  const [presets, setPresets]               = useState<Preset[]>(initialPresets)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [sortBy, setSortBy]                 = useState<'name' | 'category'>('name')
  const [showBought, setShowBought]         = useState(false)
  const [showMenu, setShowMenu]             = useState(false)
  const [showMembers, setShowMembers]       = useState(false)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null)
  const [, startTransition]                 = useTransition()

  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (state: Item[], update: { type: 'add' | 'toggle' | 'delete'; item?: Item; id?: string }) => {
      switch (update.type) {
        case 'add':    return [update.item!, ...state]
        case 'toggle': return state.map(i => i.id === update.id ? { ...i, is_bought: !i.is_bought, bought_at: new Date().toISOString(), bought_by: userId } : i)
        case 'delete': return state.filter(i => i.id !== update.id)
        default:       return state
      }
    }
  )

  useEffect(() => {
    const channel = supabase
      .channel(`list:${listId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${listId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase.from('items').select('*, category:categories(*)').eq('id', payload.new.id).single()
            if (data) setItems(prev => prev.some(i => i.id === data.id) ? prev : [data as Item, ...prev])
          }
          if (payload.eventType === 'UPDATE') setItems(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } : i))
          if (payload.eventType === 'DELETE') setItems(prev => prev.filter(i => i.id !== payload.old.id))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [listId, supabase])

  async function addItem(name: string, quantity: string, categoryId: string | null) {
    const trimmedName = name.trim();
    
    // Check if item already exists on the active list
    const existingItem = items.find(i => 
      i.name.toLowerCase() === trimmedName.toLowerCase() && 
      i.archived_at === null
    );

    if (existingItem) {
      if (existingItem.is_bought && !showBought) {
        setShowBought(true);
      }

      const quantityChanged = (existingItem.quantity || '') !== (quantity || '');
      const categoryChanged = existingItem.category_id !== categoryId;
      
      if (quantityChanged || categoryChanged) {
        startTransition(() => {
          setItems(prev => prev.map(i => i.id === existingItem.id ? { ...i, quantity: quantity || null, category_id: categoryId } : i));
        });
        await supabase.from('items').update({ quantity: quantity || null, category_id: categoryId }).eq('id', existingItem.id);
      }

      // Small delay to allow the DOM to render if showBought was just flipped to true
      setTimeout(() => {
        setHighlightedItemId(existingItem.id);
      }, 50);
      
      setTimeout(() => setHighlightedItemId(null), 1500);
      setSelectedItemForEdit(null);
      return;
    }

    const tempId = crypto.randomUUID()
    const optimisticItem: Item = {
      id: tempId, household_id: householdId, list_id: listId, category_id: categoryId, name: trimmedName,
      quantity: quantity || null, note: null, added_by: userId, is_bought: false,
      bought_by: null, bought_at: null, archived_at: null, created_at: new Date().toISOString(),
      category: categories.find(c => c.id === categoryId) ?? null,
    }
    startTransition(() => { addOptimistic({ type: 'add', item: optimisticItem }) })

    const { data: newItem, error } = await supabase
      .from('items')
      .insert({ household_id: householdId, list_id: listId, category_id: categoryId, name: trimmedName, quantity: quantity || null, added_by: userId })
      .select('*, category:categories(*)')
      .single()

    if (!error && newItem) {
      setItems(prev => prev.some(i => i.id === newItem.id) ? prev : [newItem as Item, ...prev])
    }
  }

  async function applyPreset(preset: Preset) {
    if (!preset.ingredients || preset.ingredients.length === 0) return;

    // Pobierz wszystkie aktywne produkty by zapobiec duplikatom
    const existingNames = new Set(
      items.filter(i => i.archived_at === null).map(i => i.name.trim().toLowerCase())
    );

    const itemsToAdd = preset.ingredients
      .filter(ing => ing.trim() !== '')
      .map(ing => ing.trim())
      .filter(ing => !existingNames.has(ing.toLowerCase()));

    if (itemsToAdd.length === 0) {
      alert(`Wszystkie składniki z szablonu "${preset.name}" są już na liście!`);
      return;
    }

    const optimisticNewItems = itemsToAdd.map(name => ({
      id: crypto.randomUUID(),
      household_id: householdId,
      list_id: listId,
      category_id: null,
      name,
      quantity: null,
      note: null,
      added_by: userId,
      is_bought: false,
      bought_by: null,
      bought_at: null,
      archived_at: null,
      created_at: new Date().toISOString(),
      category: null,
    }));

    // Optymistyczne dodanie
    optimisticNewItems.forEach(item => {
      startTransition(() => { addOptimistic({ type: 'add', item }) })
    });

    const rowsToInsert = itemsToAdd.map(name => ({
      household_id: householdId,
      list_id: listId,
      name,
      added_by: userId
    }));

    const { data: insertedItems, error } = await supabase
      .from('items')
      .insert(rowsToInsert)
      .select('*, category:categories(*)');

    if (!error && insertedItems) {
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newOnes = insertedItems.filter(i => !existingIds.has(i.id)) as Item[];
        return [...newOnes, ...prev];
      });
      // Opcjonalny toast (zamiast alertu), ale alert dla uproszczenia
      // alert(`Dodano ${insertedItems.length} składników z szablonu "${preset.name}".`);
    }
  }

  async function saveAsPreset(name: string) {
    const activeNames = items
      .filter(i => i.archived_at === null && !i.is_bought)
      .map(i => i.name.trim())
      .filter(n => n !== '');

    if (activeNames.length === 0) {
      alert('Nie masz żadnych aktywnych (niekupionych) produktów do zapisania jako szablon.');
      return;
    }

    const { data: newPreset, error } = await supabase
      .from('presets')
      .insert({
        household_id: householdId,
        name,
        ingredients: activeNames
      })
      .select('*')
      .single();

    if (!error && newPreset) {
      setPresets(prev => [...prev, newPreset as Preset]);
    }
  }

  async function toggleItem(id: string) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const nextIsBought = !item.is_bought
    const nextBoughtBy = nextIsBought ? userId : null
    const nextBoughtAt = nextIsBought ? new Date().toISOString() : null

    startTransition(() => { addOptimistic({ type: 'toggle', id }) })
    const { error } = await supabase.from('items').update({ is_bought: nextIsBought, bought_by: nextBoughtBy, bought_at: nextBoughtAt }).eq('id', id)
    
    if (!error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_bought: nextIsBought, bought_by: nextBoughtBy, bought_at: nextBoughtAt } : i))
    }
  }

  async function deleteItem(id: string) {
    const item = items.find(i => i.id === id)
    startTransition(() => { addOptimistic({ type: 'delete', id }) })
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const activeItems  = optimisticItems.filter(i => !i.is_bought && i.archived_at === null && (filterCategory === null || i.category_id === filterCategory))
  const boughtItems  = optimisticItems.filter(i => i.is_bought && i.archived_at === null).sort((a, b) => a.name.localeCompare(b.name))
  const totalCount   = optimisticItems.filter(i => !i.archived_at).length
  const boughtCount  = boughtItems.length
  const progress     = totalCount > 0 ? (boughtCount / totalCount) * 100 : 0

  const sortedActiveItems = [...activeItems].sort((a, b) => a.name.localeCompare(b.name))

  const grouped = categories.reduce<Record<string, Item[]>>((acc, cat) => {
    const catItems = activeItems.filter(i => i.category_id === cat.id).sort((a, b) => a.name.localeCompare(b.name))
    if (catItems.length > 0) acc[cat.id] = catItems
    return acc
  }, {})
  const uncategorized = activeItems.filter(i => !i.category_id).sort((a, b) => a.name.localeCompare(b.name))

  // Dynamiczne połączenie historii zakupów z aktualnymi produktami na liście
  // dzięki temu nowo dodane produkty od razu pojawią się w podpowiedziach
  const combinedSuggestions = useMemo(() => {
    const map = new Map<string, FrequentItem>()
    for (const fi of frequentItems) {
      map.set(fi.name.toLowerCase(), fi)
    }
    for (const i of items) {
      const key = i.name.toLowerCase()
      if (!map.has(key) && i.name.trim() !== '') {
        map.set(key, { name: i.name.trim(), category_id: i.category_id, occurrence_count: 1 })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.occurrence_count - a.occurrence_count)
  }, [frequentItems, items])

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md text-body-md mb-24 overflow-x-hidden">
      {/* Top Navigation Anchor */}
      <header className="bg-surface docked full-width top-0 shadow-sm z-40 sticky">
        <div className="flex items-center justify-between px-margin-mobile w-full max-w-screen-sm mx-auto h-16">
          <button onClick={() => router.push(`/list?householdId=${householdId}`)} className="active:scale-95 transition-transform duration-200 text-primary">
            <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
          </button>
          <h1 className="font-headline-lg text-[24px] font-bold text-primary truncate px-4 flex items-center gap-2">
            <span>{listEmoji}</span> {listName}
          </h1>
          <div className="relative">
            <button onClick={() => setShowMenu(m => !m)} className="active:scale-95 transition-transform duration-200 text-primary">
              <span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-border-subtle bg-surface-container-lowest shadow-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-surface-container">
                    <p className="text-[12px] text-on-surface-variant truncate">{userEmail}</p>
                  </div>
                  <button onClick={() => { setShowMenu(false); setShowMembers(true); }} className="w-full text-left px-3 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-low transition-colors border-b border-surface-container">
                    Członkowie domostwa
                  </button>
                  <button onClick={signOut} className="w-full text-left px-3 py-2.5 text-[14px] text-error hover:bg-error-container/20 transition-colors">
                    Wyloguj się
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {totalCount > 0 && (
          <div className="h-1 bg-surface-container-high w-full">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <main className="max-w-screen-sm mx-auto pt-4 px-margin-mobile">
        {/* Integrated Header Gradient Section */}
        <section className="mt-4 mb-8 p-6 rounded-3xl bg-gradient-to-br from-primary-container to-primary text-on-primary-container shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-headline-md text-[20px] font-bold mb-1">Zrób zapasy!</h2>
            <p className="font-body-md text-[14px] opacity-90">Masz {activeItems.length} produktów do kupienia.</p>
          </div>
          {/* Decorative circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </section>

        <CategoryFilter categories={categories} activeCategory={filterCategory} onSelect={setFilterCategory} />

        <PresetsCarousel 
          presets={presets} 
          onApplyPreset={applyPreset} 
          onSaveAsPreset={saveAsPreset} 
        />

        {/* Add Item form */}
        <div className="mb-8">
          <AddItemForm 
            categories={categories} 
            frequentItems={combinedSuggestions} 
            activeItems={activeItems}
            selectedItemForEdit={selectedItemForEdit}
            defaultCategoryId={filterCategory} 
            onAdd={addItem} 
          />
        </div>

        {/* Items Content */}
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-headline-md text-[20px] font-semibold text-on-surface">Twoje produkty</h3>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-container-low rounded-xl p-1">
              <button onClick={() => setSortBy('name')} className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${sortBy === 'name' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
                A-Z
              </button>
              <button onClick={() => setSortBy('category')} className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${sortBy === 'category' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
                Kategorie
              </button>
            </div>
            <span className="text-on-surface-variant font-label-sm text-[12px] flex items-center gap-1 hidden sm:flex">
              {activeItems.length} do kupienia
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sortBy === 'name' ? (
            <div className="space-y-4">
              {sortedActiveItems.map(item => <ItemRow key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} onEdit={() => setSelectedItemForEdit({ ...item })} isHighlighted={highlightedItemId === item.id} />)}
            </div>
          ) : (
            <>
              {uncategorized.length > 0 && (
                <div className="space-y-4">
                  {uncategorized.map(item => <ItemRow key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} onEdit={() => setSelectedItemForEdit({ ...item })} isHighlighted={highlightedItemId === item.id} />)}
                </div>
              )}

              {categories.map(cat => {
                const catItems = grouped[cat.id]
                if (!catItems) return null
                return (
                  <div key={cat.id} className="space-y-4 mt-2">
                    {catItems.map(item => <ItemRow key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} onEdit={() => setSelectedItemForEdit({ ...item })} isHighlighted={highlightedItemId === item.id} />)}
                  </div>
                )
              })}
            </>
          )}

          {activeItems.length === 0 && (
            <div className="text-center py-16 text-outline-variant">
              <div className="text-4xl mb-3 opacity-60">✨</div>
              <p className="text-[14px] font-medium">Wszystko kupione!</p>
            </div>
          )}
        </div>

        {/* Bought Items Section */}
        {boughtItems.length > 0 && (
          <div className="mt-12">
            <button onClick={() => setShowBought(b => !b)}
              className="flex items-center gap-2 font-label-sm text-[12px] text-on-surface-variant hover:text-primary transition-colors w-full"
            >
              <div className="flex-1 h-px bg-surface-container-high" />
              <span>Kupione ({boughtCount})</span>
              <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: showBought ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
              <div className="flex-1 h-px bg-surface-container-high" />
            </button>
            {showBought && (
              <div className="mt-4 grid grid-cols-1 gap-4">
                {boughtItems.map(item => <ItemRow key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} onEdit={() => setSelectedItemForEdit({ ...item })} isHighlighted={highlightedItemId === item.id} />)}
              </div>
            )}
          </div>
        )}
      </main>

      {showMembers && <MembersModal householdId={householdId} onClose={() => setShowMembers(false)} />}
    </div>
  )
}
