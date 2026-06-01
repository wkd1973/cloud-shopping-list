'use client'

import { useRef, useState, useEffect } from 'react'
import type { Category, FrequentItem, Item } from '@/lib/types'

interface Props {
  categories:          Category[]
  frequentItems?:      FrequentItem[]
  activeItems?:        Item[]
  selectedItemForEdit?: Item | null
  defaultCategoryId:   string | null
  onAdd:               (name: string, quantity: string, categoryId: string | null) => void
}

export default function AddItemForm({ categories, frequentItems = [], activeItems = [], selectedItemForEdit, defaultCategoryId, onAdd }: Props) {
  const [name, setName]             = useState('')
  const [quantity, setQuantity]     = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(defaultCategoryId)
  const [expanded, setExpanded]     = useState(false)
  const [shaking, setShaking]       = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectedItemForEdit) {
      setName(selectedItemForEdit.name)
      setQuantity(selectedItemForEdit.quantity || '')
      setCategoryId(selectedItemForEdit.category_id)
      setExpanded(true)
      inputRef.current?.focus()
    }
  }, [selectedItemForEdit])

  const existingItem = activeItems.find(i => i.name.toLowerCase() === name.trim().toLowerCase());
  const isEditing = !!existingItem;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setShaking(true)
      setTimeout(() => setShaking(false), 400)
      inputRef.current?.focus()
      return
    }
    onAdd(name.trim(), quantity.trim(), categoryId)
    setName('')
    setQuantity('')
    setExpanded(false)
    inputRef.current?.blur()
  }

  function handleSuggestionClick(suggestion: FrequentItem) {
    setName(suggestion.name)
    if (suggestion.category_id) {
      setCategoryId(suggestion.category_id)
    }
    inputRef.current?.focus()
  }

  const filteredSuggestions = frequentItems
    .filter(item => name.trim() === '' || (item.name.toLowerCase().includes(name.toLowerCase()) && item.name.toLowerCase() !== name.toLowerCase()))
    .slice(0, 5)

  return (
    <form onSubmit={handleSubmit}
      className={`relative rounded-2xl border bg-surface-container-lowest transition-all duration-300 ${shaking ? 'animate-shake border-error' : ''} ${expanded ? 'border-primary shadow-md' : 'border-border-subtle hover:border-outline-variant'}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 relative">
        <span className="material-symbols-outlined text-outline-variant text-[20px] flex-shrink-0">add_circle</span>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Dodaj produkt…"
          className="flex-1 bg-transparent font-body-md text-[14px] text-on-surface placeholder:text-outline-variant focus:outline-none w-full"
        />
        <button type="submit"
          className="flex-shrink-0 px-4 py-1.5 rounded-xl bg-primary-container hover:bg-emerald-600 text-on-primary-container font-label-sm text-[12px] font-bold transition-all active:scale-95"
        >
          {isEditing ? 'Zapisz' : 'Dodaj'}
        </button>
      </div>

      {expanded && filteredSuggestions.length > 0 && (
        <div className="absolute top-[3.5rem] left-0 right-0 mx-2 bg-surface-container-lowest border border-surface-container rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 py-2">
          <span className="text-[10px] uppercase font-bold text-outline-variant tracking-wider ml-4 mb-1 block">Podpowiedzi</span>
          {filteredSuggestions.map(sug => {
            const cat = categories.find(c => c.id === sug.category_id)
            return (
              <button key={sug.name} type="button" onClick={() => handleSuggestionClick(sug)} 
                className="w-full text-left px-4 py-2 text-[14px] font-body-md text-on-surface hover:bg-surface-container-highest flex items-center justify-between transition-colors"
              >
                <span>{sug.name}</span>
                {cat && <span className="text-[12px] text-on-surface-variant flex items-center gap-1"><span className="opacity-70">{cat.emoji}</span> {cat.name}</span>}
              </button>
            )
          })}
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-container pt-3 space-y-3 bg-surface-container-low/50 rounded-b-2xl">

          <input
            type="text"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="Ilość (np. 2 kg, 3 szt) — opcjonalnie"
            className="w-full bg-transparent font-code-sm text-[12px] text-on-surface-variant placeholder:text-outline-variant focus:outline-none"
          />
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={() => setCategoryId(null)}
                className={`px-3 py-1.5 rounded-full font-label-sm text-[12px] transition-all border
                  ${categoryId === null ? 'bg-secondary text-on-secondary border-secondary shadow-sm' : 'bg-surface-container-lowest text-on-surface-variant border-border-subtle hover:border-outline-variant'}`}
              >
                Bez kategorii
              </button>
              {categories.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-sm text-[12px] transition-all border
                    ${categoryId === cat.id ? 'border-transparent shadow-sm' : 'bg-surface-container-lowest text-on-surface-variant border-border-subtle hover:border-outline-variant'}`}
                  style={categoryId === cat.id ? { backgroundColor: cat.color, color: '#fff' } : {}}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  )
}
