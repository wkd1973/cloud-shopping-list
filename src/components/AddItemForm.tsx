'use client'

import { useRef, useState } from 'react'
import type { Category } from '@/lib/types'

interface Props {
  categories:        Category[]
  defaultCategoryId: string | null
  onAdd:             (name: string, quantity: string, categoryId: string | null) => void
}

export default function AddItemForm({ categories, defaultCategoryId, onAdd }: Props) {
  const [name, setName]             = useState('')
  const [quantity, setQuantity]     = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(defaultCategoryId)
  const [expanded, setExpanded]     = useState(false)
  const [shaking, setShaking]       = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

  return (
    <form onSubmit={handleSubmit}
      className={`rounded-2xl border bg-surface-container-lowest overflow-hidden transition-all duration-300 ${shaking ? 'animate-shake border-error' : ''} ${expanded ? 'border-primary shadow-md' : 'border-border-subtle hover:border-outline-variant'}`}
    >
      <div className="flex items-center gap-2 px-4 py-3">
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
          Dodaj
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-container pt-3 space-y-3 bg-surface-container-low/50">
          <input
            type="text"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="Ilość (np. 2 kg, 3 szt) — opcjonalnie"
            className="w-full bg-transparent font-code-sm text-[12px] text-on-surface-variant placeholder:text-outline-variant focus:outline-none"
          />
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
