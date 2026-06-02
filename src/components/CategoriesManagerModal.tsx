'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

interface Props {
  householdId: string
  categories: Category[]
  onClose: () => void
  onCategoriesUpdated: (categories: Category[]) => void
}

const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', 
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', 
  '#f43f5e', '#64748b', '#78716c', '#6b7280'
]

export default function CategoriesManagerModal({ householdId, categories, onClose, onCategoriesUpdated }: Props) {
  const supabase = createClient()
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('🛒')
  const [editColor, setEditColor] = useState('#6366f1')
  const [isSaving, setIsSaving] = useState(false)
  
  const [isCreating, setIsCreating] = useState(false)

  function startEdit(c: Category) {
    setEditingId(c.id)
    setIsCreating(false)
    setEditName(c.name)
    setEditEmoji(c.emoji || '🛒')
    setEditColor(c.color || '#6366f1')
  }
  
  function startCreate() {
    setEditingId(null)
    setIsCreating(true)
    setEditName('')
    setEditEmoji('🛒')
    setEditColor('#6366f1')
  }

  function cancelEdit() {
    setEditingId(null)
    setIsCreating(false)
  }

  async function saveCategory(id: string | null) {
    if (!editName.trim()) return
    setIsSaving(true)
    
    if (id) {
      // Edycja istniejącego
      const { data, error } = await supabase
        .from('categories')
        .update({ name: editName.trim(), emoji: editEmoji.trim() || '🛒', color: editColor })
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        const updated = localCategories.map(c => c.id === id ? data as Category : c)
        setLocalCategories(updated)
        onCategoriesUpdated(updated)
        setEditingId(null)
      } else {
        alert('Nie udało się zapisać kategorii.')
      }
    } else {
      // Tworzenie nowego
      const { data, error } = await supabase
        .from('categories')
        .insert({
          household_id: householdId,
          name: editName.trim(),
          emoji: editEmoji.trim() || '🛒',
          color: editColor
        })
        .select()
        .single()

      if (!error && data) {
        const updated = [...localCategories, data as Category]
        setLocalCategories(updated)
        onCategoriesUpdated(updated)
        setIsCreating(false)
      } else {
        alert('Nie udało się utworzyć kategorii.')
      }
    }
    
    setIsSaving(false)
  }

  async function deleteCategory(id: string) {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię? Produkty z tej kategorii zostaną "Bez kategorii".')) return
    
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) {
      const updated = localCategories.filter(c => c.id !== id)
      setLocalCategories(updated)
      onCategoriesUpdated(updated)
    } else {
      alert('Nie udało się usunąć kategorii.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface sticky top-0 z-10">
          <h2 className="font-headline-sm text-[20px] font-bold text-on-surface">Zarządzaj kategoriami</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {!isCreating && (
            <button onClick={startCreate} className="w-full py-3 mb-2 flex items-center justify-center gap-2 border-2 border-dashed border-primary/50 text-primary rounded-2xl hover:bg-primary-container/20 transition-all font-bold active:scale-95">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Stwórz nową kategorię
            </button>
          )}

          {isCreating && (
             <div className="bg-primary-container/20 rounded-2xl p-4 border border-primary/30 mb-4 animate-in fade-in duration-200">
               <h3 className="font-bold text-[16px] text-primary mb-3">Nowa kategoria</h3>
               <div className="mb-3 flex gap-3">
                 <div className="w-16">
                   <label className="text-[12px] font-bold text-on-surface-variant mb-1 block">Ikona</label>
                   <input
                     type="text"
                     maxLength={2}
                     value={editEmoji}
                     onChange={e => setEditEmoji(e.target.value)}
                     className="w-full bg-surface border border-outline-variant rounded-xl px-2 py-2 text-[14px] text-center text-on-surface focus:outline-none focus:border-primary transition-colors"
                     placeholder="🛒"
                   />
                 </div>
                 <div className="flex-1">
                   <label className="text-[12px] font-bold text-on-surface-variant mb-1 block">Nazwa kategorii</label>
                   <input
                     type="text"
                     value={editName}
                     onChange={e => setEditName(e.target.value)}
                     className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors"
                     placeholder="Np. Warzywa..."
                   />
                 </div>
               </div>
               
               <div className="mb-3">
                 <label className="text-[12px] font-bold text-on-surface-variant mb-2 block">Kolor (tło ikony)</label>
                 <div className="flex flex-wrap gap-2">
                   {PREDEFINED_COLORS.map(color => (
                     <button
                       key={color}
                       onClick={() => setEditColor(color)}
                       className={`w-8 h-8 rounded-full border-2 transition-transform ${editColor === color ? 'border-on-surface scale-110' : 'border-transparent hover:scale-105'}`}
                       style={{ backgroundColor: color }}
                     />
                   ))}
                 </div>
               </div>

               <div className="flex gap-2 mt-4 pt-4 border-t border-primary/20">
                 <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl font-bold text-[14px] bg-surface text-on-surface border border-surface-container hover:bg-surface-container-low transition-colors active:scale-95">
                   Anuluj
                 </button>
                 <button onClick={() => saveCategory(null)} disabled={isSaving || !editName.trim()} className="flex-1 py-2 rounded-xl font-bold text-[14px] bg-primary text-on-primary hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
                   {isSaving ? 'Tworzę...' : 'Stwórz'}
                 </button>
               </div>
             </div>
          )}

          {localCategories.length === 0 && !isCreating ? (
            <div className="text-center py-6 opacity-70">
              <span className="material-symbols-outlined text-4xl mb-2">category</span>
              <p className="text-[14px]">Nie masz żadnych kategorii.</p>
            </div>
          ) : (
            localCategories.map(c => {
              const isEditing = editingId === c.id
              return (
                <div key={c.id} className="bg-surface-container-low rounded-2xl p-4 border border-surface-container">
                  {!isEditing ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: c.color ? `${c.color}33` : '#eef6ee' }}>
                            {c.emoji}
                          </div>
                          <h3 className="font-bold text-[16px] text-on-surface">
                            {c.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(c)} disabled={isCreating || editingId !== null} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => deleteCategory(c.id)} disabled={isCreating || editingId !== null} className="w-8 h-8 flex items-center justify-center rounded-full text-error hover:bg-error-container/50 transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-200">
                      <div className="mb-3 flex gap-3">
                        <div className="w-16">
                          <label className="text-[12px] font-bold text-on-surface-variant mb-1 block">Ikona</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={editEmoji}
                            onChange={e => setEditEmoji(e.target.value)}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-2 py-2 text-[14px] text-center text-on-surface focus:outline-none focus:border-primary transition-colors"
                            placeholder="🛒"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[12px] font-bold text-on-surface-variant mb-1 block">Nazwa kategorii</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="text-[12px] font-bold text-on-surface-variant mb-2 block">Kolor (tło ikony)</label>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              className={`w-8 h-8 rounded-full border-2 transition-transform ${editColor === color ? 'border-on-surface scale-110' : 'border-transparent hover:scale-105'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-surface-container">
                        <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl font-bold text-[14px] bg-surface text-on-surface border border-surface-container hover:bg-surface-container-low transition-colors active:scale-95">
                          Anuluj
                        </button>
                        <button onClick={() => saveCategory(c.id)} disabled={isSaving || !editName.trim()} className="flex-1 py-2 rounded-xl font-bold text-[14px] bg-primary text-on-primary hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
                          {isSaving ? 'Zapisuję...' : 'Zapisz'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
