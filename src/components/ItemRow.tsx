'use client'

import { useState } from 'react'
import type { Item } from '@/lib/types'

interface Props {
  item:     Item
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function ItemRow({ item, onToggle, onDelete }: Props) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-xl
        bg-slate-900/60 border transition-all duration-200 item-new
        ${item.is_bought
          ? 'border-slate-800/50 opacity-50'
          : 'border-slate-800 hover:border-slate-700'
        }
      `}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200
          flex items-center justify-center
          ${item.is_bought
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-600 hover:border-emerald-500/60'
          }
        `}
        aria-label={item.is_bought ? 'Oznacz jako niekupione' : 'Oznacz jako kupione'}
      >
        {item.is_bought && (
          <svg className="w-3 h-3 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Nazwa i ilość */}
      <div className="flex-1 min-w-0">
        <span
          className={`
            text-sm relative
            ${item.is_bought ? 'text-slate-500 line-through' : 'text-slate-200'}
          `}
        >
          {item.name}
        </span>
        {item.quantity && (
          <span className="ml-2 text-xs text-slate-600 font-mono">
            {item.quantity}
          </span>
        )}
        {item.note && (
          <p className="text-xs text-slate-600 mt-0.5 truncate">{item.note}</p>
        )}
      </div>

      {/* Usuń — pojawia się na hover */}
      <button
        onClick={() => onDelete(item.id)}
        className={`
          flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center
          text-slate-700 hover:text-red-400 hover:bg-red-400/10
          transition-all duration-150
          opacity-0 group-hover:opacity-100
        `}
        aria-label="Usuń produkt"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
