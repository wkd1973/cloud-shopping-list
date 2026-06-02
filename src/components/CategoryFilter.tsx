'use client'

import { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { Category } from '@/lib/types'

interface Props {
  categories:     Category[]
  activeCategory: string | null
  onSelect:       (id: string | null) => void
}

export default function CategoryFilter({ categories, activeCategory, onSelect }: Props) {
  // Embla Carousel: loop allows infinite scroll, dragFree allows smooth manual swiping
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: true })

  if (categories.length === 0) return null

  // Duplikujemy kategorie aby upewnić się, że karuzela ma dość elementów do stworzenia pętli
  const displayCategories = categories.length < 6 
    ? [...categories, ...categories, ...categories, ...categories]
    : categories

  const handleClick = (e: React.MouseEvent, id: string) => {
    onSelect(id === activeCategory ? null : id)
  }

  return (
    <div className="mb-10 w-full">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-headline-md text-[20px] font-semibold text-on-surface">Kategorie</h3>
        {activeCategory && (
          <button onClick={() => onSelect(null)} className="text-primary font-bold font-label-sm text-[12px]">
            Wyczyść
          </button>
        )}
      </div>
      
      {/* Kontener poziomego przewijania - Embla */}
      <div className="w-full relative flex items-center" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
        <div className="overflow-hidden w-full select-none" ref={emblaRef}>
          <div className="flex gap-3 px-4 pb-4 pt-1 touch-pan-y">
            {displayCategories.map((cat, index) => (
              <button key={`${cat.id}-${index}`} onClick={(e) => handleClick(e, cat.id)}
                className={`flex-shrink-0 w-[100px] p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 hover:bg-primary-container/20 transition-all active:scale-95
                  ${activeCategory === cat.id ? 'bg-primary-container/20 border-primary-container shadow-sm' : 'bg-surface-container-low border-border-subtle'}
                `}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: cat.color ? `${cat.color}33` : '#eef6ee' }}>
                  {cat.emoji}
                </div>
                <span className="font-body-sm text-[13px] font-bold text-on-surface truncate w-full text-center pointer-events-none">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
