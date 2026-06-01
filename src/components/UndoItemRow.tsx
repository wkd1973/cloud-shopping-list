'use client'

import type { Item } from '@/lib/types'

interface Props {
  item:          Item
  onRestore:     (item: Item) => void
  onPermanentDelete: (id: string) => void
}

export default function UndoItemRow({ item, onRestore, onPermanentDelete }: Props) {
  const cat = item.category
  
  return (
    <div className={`px-3 py-2 rounded-xl border shadow-sm flex items-center justify-between group transition-all duration-300 bg-surface-container/50 border-gray-100 opacity-80 hover:opacity-100`}>
      <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 bg-surface-container-high/50 grayscale`}>
          {cat?.emoji || '🛒'}
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-body-lg text-[15px] font-bold truncate text-on-surface-variant line-through`}>
              {item.name}
            </h4>
            {cat && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}>
                {cat.name}
              </span>
            )}
          </div>
          {(item.quantity || item.note) && (
             <div className="flex items-center gap-2 flex-wrap">
              {item.quantity && (
                <span className="text-text-secondary text-[11px] font-code-sm line-through">{item.quantity}</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onPermanentDelete(item.id)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-error hover:bg-error/10 active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Usuń na zawsze"
          title="Usuń trwale"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon="delete_forever">delete_forever</span>
        </button>
        <button
          onClick={() => onRestore(item)}
          className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all text-primary hover:bg-primary-container/10`}
          aria-label="Przywróć na listę"
          title="Przywróć"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>restore</span>
        </button>
      </div>
    </div>
  )
}
