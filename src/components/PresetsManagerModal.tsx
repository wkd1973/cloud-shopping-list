'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Preset } from '@/lib/types'

interface Props {
  householdId: string
  presets: Preset[]
  onClose: () => void
  onPresetsUpdated: (presets: Preset[]) => void
}

export default function PresetsManagerModal({ householdId, presets, onClose, onPresetsUpdated }: Props) {
  const supabase = createClient()
  const [localPresets, setLocalPresets] = useState<Preset[]>(presets)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [editName, setEditName] = useState('')
  const [editIngredients, setEditIngredients] = useState<string[]>([])
  const [newIngredient, setNewIngredient] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const [isCreating, setIsCreating] = useState(false)

  function startEdit(p: Preset) {
    setEditingId(p.id)
    setIsCreating(false)
    setEditName(p.name)
    setEditIngredients([...p.ingredients])
    setNewIngredient('')
  }
  
  function startCreate() {
    setEditingId(null)
    setIsCreating(true)
    setEditName('')
    setEditIngredients([])
    setNewIngredient('')
  }

  function cancelEdit() {
    setEditingId(null)
    setIsCreating(false)
  }

  function removeIngredient(index: number) {
    setEditIngredients(prev => prev.filter((_, i) => i !== index))
  }

  function addIngredient(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!newIngredient.trim()) return
      if (!editIngredients.some(i => i.toLowerCase() === newIngredient.trim().toLowerCase())) {
        setEditIngredients(prev => [...prev, newIngredient.trim()])
      }
      setNewIngredient('')
    }
  }
  
  function addIngredientBtn() {
    if (!newIngredient.trim()) return
    if (!editIngredients.some(i => i.toLowerCase() === newIngredient.trim().toLowerCase())) {
      setEditIngredients(prev => [...prev, newIngredient.trim()])
    }
    setNewIngredient('')
  }

  async function savePreset(id: string | null) {
    if (!editName.trim()) return
    setIsSaving(true)
    
    if (id) {
      // Edycja istniejącego
      const { data, error } = await supabase
        .from('presets')
        .update({ name: editName.trim(), ingredients: editIngredients })
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        const updated = localPresets.map(p => p.id === id ? data as Preset : p)
        setLocalPresets(updated)
        onPresetsUpdated(updated)
        setEditingId(null)
      } else {
        alert('Nie udało się zapisać szablonu.')
      }
    } else {
      // Tworzenie nowego
      const { data, error } = await supabase
        .from('presets')
        .insert({
          household_id: householdId,
          name: editName.trim(),
          ingredients: editIngredients
        })
        .select()
        .single()

      if (!error && data) {
        const updated = [...localPresets, data as Preset]
        setLocalPresets(updated)
        onPresetsUpdated(updated)
        setIsCreating(false)
      } else {
        alert('Nie udało się utworzyć szablonu.')
      }
    }
    
    setIsSaving(false)
  }

  async function deletePreset(id: string) {
    if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return
    
    const { error } = await supabase.from('presets').delete().eq('id', id)
    if (!error) {
      const updated = localPresets.filter(p => p.id !== id)
      setLocalPresets(updated)
      onPresetsUpdated(updated)
    } else {
      alert('Nie udało się usunąć szablonu.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface sticky top-0 z-10">
          <h2 className="font-headline-sm text-[20px] font-bold text-on-surface">Zarządzaj szablonami</h2>
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
              Stwórz nowy szablon
            </button>
          )}

          {isCreating && (
             <div className="bg-primary-container/20 rounded-2xl p-4 border border-primary/30 mb-4 animate-in fade-in duration-200">
               <h3 className="font-bold text-[16px] text-primary mb-3">Nowy szablon</h3>
               <div className="mb-3">
                 <label className="text-[12px] font-bold text-on-surface-variant mb-1 block">Nazwa szablonu</label>
                 <input
                   type="text"
                   value={editName}
                   onChange={e => setEditName(e.target.value)}
                   className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors"
                   placeholder="Nasz nowy przepis..."
                 />
               </div>
               
               <div className="mb-3">
                 <label className="text-[12px] font-bold text-on-surface-variant mb-1 block">Składniki</label>
                 <div className="flex flex-wrap gap-2 mb-2 bg-surface p-2 rounded-xl border border-surface-container min-h-[44px]">
                   {editIngredients.map((ing, idx) => (
                     <span key={idx} className="bg-primary-container text-on-primary-container px-2 py-1 rounded-lg text-[12px] font-bold flex items-center gap-1">
                       {ing}
                       <button onClick={() => removeIngredient(idx)} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
                         <span className="material-symbols-outlined text-[12px]">close</span>
                       </button>
                     </span>
                   ))}
                   {editIngredients.length === 0 && <span className="text-[12px] text-on-surface-variant py-1 opacity-60">Brak składników</span>}
                 </div>
                 
                 <div className="flex gap-2">
                   <input
                     type="text"
                     placeholder="Dodaj składnik (Enter)"
                     value={newIngredient}
                     onChange={e => setNewIngredient(e.target.value)}
                     onKeyDown={addIngredient}
                     className="flex-1 bg-surface border border-outline-variant rounded-xl px-3 py-2 text-[13px] text-on-surface focus:outline-none focus:border-primary transition-colors"
                   />
                   <button onClick={addIngredientBtn} className="bg-surface-container-highest text-on-surface px-3 rounded-xl text-[20px] flex items-center justify-center font-bold active:scale-95 transition-all hover:bg-primary-container hover:text-primary">
                     +
                   </button>
                 </div>
               </div>

               <div className="flex gap-2 mt-4 pt-4 border-t border-primary/20">
                 <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl font-bold text-[14px] bg-surface text-on-surface border border-surface-container hover:bg-surface-container-low transition-colors active:scale-95">
                   Anuluj
                 </button>
                 <button onClick={() => savePreset(null)} disabled={isSaving || !editName.trim()} className="flex-1 py-2 rounded-xl font-bold text-[14px] bg-primary text-on-primary hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
                   {isSaving ? 'Tworzę...' : 'Stwórz'}
                 </button>
               </div>
             </div>
          )}

          {localPresets.length === 0 && !isCreating ? (
            <div className="text-center py-6 opacity-70">
              <span className="material-symbols-outlined text-4xl mb-2">library_add</span>
              <p className="text-[14px]">Nie masz jeszcze żadnych szablonów.</p>
            </div>
          ) : (
            localPresets.map(p => {
              const isEditing = editingId === p.id
              return (
                <div key={p.id} className="bg-surface-container-low rounded-2xl p-4 border border-surface-container">
                  {!isEditing ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-[16px] text-primary">{p.name}</h3>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(p)} disabled={isCreating || editingId !== null} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => deletePreset(p.id)} disabled={isCreating || editingId !== null} className="w-8 h-8 flex items-center justify-center rounded-full text-error hover:bg-error-container/50 transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.ingredients.map((ing, idx) => (
                          <span key={idx} className="bg-surface px-2 py-1 rounded-md text-[12px] text-on-surface-variant font-medium border border-surface-container">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-200">
                      <div className="mb-3">
                        <label className="text-[12px] font-bold text-on-surface-variant mb-1 block">Nazwa szablonu</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="text-[12px] font-bold text-on-surface-variant mb-1 block">Składniki</label>
                        <div className="flex flex-wrap gap-2 mb-2 bg-surface p-2 rounded-xl border border-surface-container min-h-[44px]">
                          {editIngredients.map((ing, idx) => (
                            <span key={idx} className="bg-primary-container text-on-primary-container px-2 py-1 rounded-lg text-[12px] font-bold flex items-center gap-1">
                              {ing}
                              <button onClick={() => removeIngredient(idx)} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
                                <span className="material-symbols-outlined text-[12px]">close</span>
                              </button>
                            </span>
                          ))}
                          {editIngredients.length === 0 && <span className="text-[12px] text-on-surface-variant py-1 opacity-60">Brak składników</span>}
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                             type="text"
                             placeholder="Dodaj składnik (Enter)"
                             value={newIngredient}
                             onChange={e => setNewIngredient(e.target.value)}
                             onKeyDown={addIngredient}
                             className="flex-1 bg-surface border border-outline-variant rounded-xl px-3 py-2 text-[13px] text-on-surface focus:outline-none focus:border-primary transition-colors"
                           />
                           <button onClick={addIngredientBtn} className="bg-surface-container-highest text-on-surface px-3 rounded-xl text-[20px] flex items-center justify-center font-bold active:scale-95 transition-all hover:bg-primary-container hover:text-primary">
                             +
                           </button>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-surface-container">
                        <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl font-bold text-[14px] bg-surface text-on-surface border border-surface-container hover:bg-surface-container-low transition-colors active:scale-95">
                          Anuluj
                        </button>
                        <button onClick={() => savePreset(p.id)} disabled={isSaving || !editName.trim()} className="flex-1 py-2 rounded-xl font-bold text-[14px] bg-primary text-on-primary hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
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
