'use client'

import type { Item } from '@/lib/types'

interface Props {
  item:          Item
  onToggle:      (id: string) => void
  onDelete:      (id: string) => void
  isHighlighted?: boolean
}

export default function ItemRow({ item, onToggle, onDelete, isHighlighted }: Props) {
  const isBought = item.is_bought
  const cat = item.category
  
  return (
    <div className={`px-3 py-2 rounded-xl border shadow-sm flex items-center justify-between group transition-all duration-300
      ${isHighlighted ? 'animate-pulse bg-primary/10 border-primary scale-[1.02]' : ''}
      ${!isHighlighted && isBought ? 'bg-surface-container/30 border-gray-100 opacity-60' : ''}
      ${!isHighlighted && !isBought ? 'bg-surface-container-lowest border-gray-200 hover:border-primary' : ''}
    `}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0
          ${isBought ? 'bg-surface-container-high/50 grayscale' : 'bg-surface-container-high'}
        `}>
          {cat?.emoji || '🛒'}
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-body-lg text-[15px] font-bold truncate ${isBought ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
              {item.name}
            </h4>
            {!isBought && cat && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}>
                {cat.name}
              </span>
            )}
          </div>
          {(item.quantity || item.note) && (
            <div className="flex items-center gap-2 flex-wrap">
              {item.quantity && (
                <span className="text-text-secondary text-[11px] font-code-sm">{item.quantity}</span>
              )}
              {item.note && (
                <span className="text-text-secondary text-[11px] truncate max-w-[120px]">{item.note}</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onDelete(item.id)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-error hover:bg-error/10 active:scale-90 transition-all opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Usuń produkt"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon="delete">delete</span>
        </button>
        <button
          onClick={() => onToggle(item.id)}
          className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all
            ${isBought ? 'text-primary' : 'text-on-surface-variant hover:bg-primary-container/10'}
          `}
          aria-label={isBought ? 'Oznacz jako niekupione' : 'Oznacz jako kupione'}
        >
          <span className="material-symbols-outlined" style={isBought ? { fontVariationSettings: "'FILL' 1" } : {}}>check_circle</span>
        </button>
      </div>
    </div>
  )
}
