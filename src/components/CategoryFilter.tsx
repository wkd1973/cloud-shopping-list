'use client'

import type { Category } from '@/lib/types'

interface Props {
  categories:     Category[]
  activeCategory: string | null
  onSelect:       (id: string | null) => void
}

export default function CategoryFilter({ categories, activeCategory, onSelect }: Props) {
  if (categories.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      <button
        onClick={() => onSelect(null)}
        className={`
          flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
          ${activeCategory === null
            ? 'bg-slate-200 text-slate-950'
            : 'bg-slate-800/80 text-slate-500 hover:text-slate-400'
          }
        `}
      >
        Wszystkie
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id === activeCategory ? null : cat.id)}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            transition-all
            ${activeCategory === cat.id
              ? 'text-slate-950'
              : 'bg-slate-800/80 text-slate-500 hover:text-slate-400'
            }
          `}
          style={activeCategory === cat.id ? { backgroundColor: cat.color } : {}}
        >
          <span>{cat.emoji}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  )
}
