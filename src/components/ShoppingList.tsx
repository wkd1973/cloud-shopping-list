'use client'

import { useEffect, useOptimistic, useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category, Item, FrequentItem } from '@/lib/types'
import ItemRow from './ItemRow'
import UndoItemRow from './UndoItemRow'
import AddItemForm from './AddItemForm'
import CategoryFilter from './CategoryFilter'
import MembersModal from './MembersModal'
import PresetsCarousel from './PresetsCarousel'
import PresetsManagerModal from './PresetsManagerModal'
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
  const [showMenu, setShowMenu]             = useState(false)
  const [showMembers, setShowMembers]       = useState(false)
  const [showPresetsManager, setShowPresetsManager] = useState(false)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null)
  
  // Nowe stany dla zakładek i historii usuniętych
  const [activeTab, setActiveTab] = useState<'lista' | 'kupione' | 'undo'>('lista')
  const [undoList, setUndoList]   = useState<Item[]>([])

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
      if (existingItem.is_bought) {
        // Zmiana zachowania: po prostu przeskocz na listę i ewentualnie przejdź do kupionych,
        // albo odznacz jako niekupione jeśli dodajemy ponownie
        startTransition(() => { addOptimistic({ type: 'toggle', id: existingItem.id }) })
        await supabase.from('items').update({ is_bought: false, quantity: quantity || null, category_id: categoryId }).eq('id', existingItem.id);
        setActiveTab('lista');
      } else {
        const quantityChanged = (existingItem.quantity || '') !== (quantity || '');
        const categoryChanged = existingItem.category_id !== categoryId;
        
        if (quantityChanged || categoryChanged) {
          startTransition(() => {
            setItems(prev => prev.map(i => i.id === existingItem.id ? { ...i, quantity: quantity || null, category_id: categoryId } : i));
          });
          await supabase.from('items').update({ quantity: quantity || null, category_id: categoryId }).eq('id', existingItem.id);
        }
        setActiveTab('lista');
      }

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
    setActiveTab('lista')

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

    optimisticNewItems.forEach(item => {
      startTransition(() => { addOptimistic({ type: 'add', item }) })
    });
    setActiveTab('lista')

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
    if (item) {
      setUndoList(prev => [item, ...prev.filter(u => u.id !== item.id)])
    }
    startTransition(() => { addOptimistic({ type: 'delete', id }) })
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  async function restoreItem(itemToRestore: Item) {
    const existingItem = items.find(i => i.name.toLowerCase() === itemToRestore.name.toLowerCase() && i.archived_at === null);
    
    if (existingItem) {
      // Jeśli już jest na liście, po prostu wyrzuć z historii cofania i odznacz jako kupione
      setUndoList(prev => prev.filter(i => i.id !== itemToRestore.id));
      if (existingItem.is_bought) {
         toggleItem(existingItem.id)
      }
      return;
    }

    // Usunięcie z kosza i natychmiastowe wrzucenie z powrotem na listę (optymistycznie)
    setUndoList(prev => prev.filter(i => i.id !== itemToRestore.id));
    
    startTransition(() => { addOptimistic({ type: 'add', item: itemToRestore }) })
    setActiveTab(itemToRestore.is_bought ? 'kupione' : 'lista')

    const { data: newItem, error } = await supabase
      .from('items')
      .insert({
        household_id: itemToRestore.household_id,
        list_id: itemToRestore.list_id,
        category_id: itemToRestore.category_id,
        name: itemToRestore.name,
        quantity: itemToRestore.quantity,
        note: itemToRestore.note,
        added_by: itemToRestore.added_by,
        is_bought: itemToRestore.is_bought,
        bought_by: itemToRestore.bought_by,
        bought_at: itemToRestore.bought_at
      })
      .select('*, category:categories(*)')
      .single()

    if (!error && newItem) {
      setItems(prev => prev.some(i => i.id === newItem.id) ? prev : [newItem as Item, ...prev])
    } else {
      // Jeśli błąd, przywracamy do kosza
      setUndoList(prev => [itemToRestore, ...prev])
    }
  }

  function permanentDeleteUndo(id: string) {
    setUndoList(prev => prev.filter(i => i.id !== id))
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
                  <button onClick={() => { setShowMenu(false); setShowMembers(true); }} className="w-full text-left px-3 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-low transition-colors border-b border-surface-container flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    Członkowie domostwa
                  </button>
                  <button onClick={() => { setShowMenu(false); setShowPresetsManager(true); }} className="w-full text-left px-3 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-low transition-colors border-b border-surface-container flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">edit_square</span>
                    Zarządzaj szablonami
                  </button>
                  <button onClick={() => { setShowMenu(false); router.push('/help'); }} className="w-full text-left px-3 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-low transition-colors border-b border-surface-container flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    Pomoc i informacje
                  </button>
                  <button onClick={signOut} className="w-full text-left px-3 py-2.5 text-[14px] text-error hover:bg-error-container/20 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
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
        <section className="mt-4 mb-6 px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2">
          <span className="text-lg">🛒</span>
          <p className="text-[14px] text-emerald-800 font-medium">
            Masz <strong className="font-bold">{optimisticItems.filter(i => !i.is_bought && i.archived_at === null).length}</strong> produktów do kupienia
          </p>
        </section>

        {/* Zakładki (Tabs) */}
        <div className="flex bg-surface-container-low rounded-xl p-1 mb-6 shadow-sm">
          <button 
            onClick={() => setActiveTab('lista')} 
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-bold transition-all ${activeTab === 'lista' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">shopping_bag</span>
            <span>Do kupienia</span>
          </button>
          <button 
            onClick={() => setActiveTab('kupione')} 
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-bold transition-all ${activeTab === 'kupione' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">task_alt</span>
            <span>Kupione</span>
          </button>
          <button 
            onClick={() => setActiveTab('undo')} 
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-bold transition-all relative ${activeTab === 'undo' ? 'bg-surface shadow-sm text-error' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete</span>
            <span>Kosz</span>
            {undoList.length > 0 && (
              <span className="absolute top-1 right-2 sm:right-4 w-2 h-2 bg-error rounded-full"></span>
            )}
          </button>
        </div>

        {/* Wyświetlanie aktywnej zakładki */}
        {activeTab === 'lista' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CategoryFilter categories={categories} activeCategory={filterCategory} onSelect={setFilterCategory} />

            <PresetsCarousel 
              presets={presets} 
              onApplyPreset={applyPreset} 
              onSaveAsPreset={saveAsPreset} 
            />

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
                  <p className="text-[14px] font-medium">Lista do kupienia jest pusta!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'kupione' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-headline-md text-[20px] font-semibold text-on-surface">Kupione produkty ({boughtItems.length})</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {boughtItems.length > 0 ? (
                boughtItems.map(item => <ItemRow key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} onEdit={() => setSelectedItemForEdit({ ...item })} isHighlighted={highlightedItemId === item.id} />)
              ) : (
                <div className="text-center py-16 text-outline-variant">
                  <div className="text-4xl mb-3 opacity-60">🛒</div>
                  <p className="text-[14px] font-medium">Jeszcze nic nie kupiono.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'undo' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-headline-md text-[20px] font-semibold text-error">Kosz (Usunięte)</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-4">
              {undoList.length > 0 ? (
                undoList.map(item => <UndoItemRow key={`undo-${item.id}`} item={item} onRestore={restoreItem} onPermanentDelete={permanentDeleteUndo} />)
              ) : (
                <div className="text-center py-16 text-outline-variant">
                  <div className="text-4xl mb-3 opacity-60">🗑️</div>
                  <p className="text-[14px] font-medium">Kosz jest pusty.</p>
                  <p className="text-[12px] mt-2">Usunięte produkty znikają bezpowrotnie po wyjściu z aplikacji.</p>
                </div>
              )}
            </div>
            {undoList.length > 0 && (
               <button onClick={() => setUndoList([])} className="w-full py-3 text-center text-[14px] font-semibold text-error hover:bg-error-container/20 rounded-xl transition-all">
                 Opróżnij kosz natychmiast
               </button>
            )}
          </div>
        )}

      </main>

      {showMembers && <MembersModal householdId={householdId} onClose={() => setShowMembers(false)} />}
      {showPresetsManager && (
        <PresetsManagerModal 
          householdId={householdId}
          presets={presets} 
          onClose={() => setShowPresetsManager(false)} 
          onPresetsUpdated={setPresets} 
        />
      )}
    </div>
  )
}
