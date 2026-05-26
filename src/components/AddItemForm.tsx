'use client'

import { useRef, useState } from 'react'
import type { Category } from '@/lib/types'

interface Props {
  categories:        Category[]
  defaultCategoryId: string | null
  onAdd:             (name: string, quantity: string, categoryId: string | null) => void
}

export default function AddItemForm({ categories, defaultCategoryId, onAdd }: Props) {
  const [name, setName]         = useState('')
  const [quantity, setQuantity] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(defaultCategoryId)
  const [expanded, setExpanded] = useState(false)
  const [shaking, setShaking]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      // Shake animation — feedback bez toasta
      setShaking(true)
      setTimeout(() => setShaking(false), 400)
      inputRef.current?.focus()
      return
    }

    onAdd(name.trim(), quantity.trim(), categoryId)
    setName('')
    setQuantity('')
    // Zostaw kategorię — zazwyczaj dodajemy kilka rzeczy z tej samej kategorii
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden
        transition-all duration-200
        ${shaking ? 'shake' : ''}
      `}
    >
      {/* Główny input */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="text-slate-600 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Dodaj produkt…"
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600
                     focus:outline-none"
        />
        {name && (
          <button
            type="submit"
            className="flex-shrink-0 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400
                       text-slate-950 text-xs font-semibold transition-all active:scale-95"
          >
            Dodaj
          </button>
        )}
      </div>

      {/* Rozwinięte opcje */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-800/60 pt-2.5 space-y-2.5">
          {/* Ilość */}
          <input
            type="text"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="Ilość (np. 2 kg, 3 szt) — opcjonalnie"
            className="w-full bg-transparent text-xs text-slate-400 placeholder:text-slate-700
                       focus:outline-none"
          />

          {/* Kategorie */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className={`
                  px-2.5 py-1 rounded-full text-xs transition-all
                  ${categoryId === null
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-slate-800/60 text-slate-500 hover:text-slate-400'
                  }
                `}
              >
                Bez kategorii
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`
                    flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all
                    ${categoryId === cat.id
                      ? 'text-slate-950 font-medium'
                      : 'bg-slate-800/60 text-slate-500 hover:text-slate-400'
                    }
                  `}
                  style={categoryId === cat.id ? { backgroundColor: cat.color } : {}}
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
