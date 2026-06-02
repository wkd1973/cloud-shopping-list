'use client'

import { useState, useRef, useEffect } from 'react'
import type { Category } from '@/lib/types'

interface Props {
  categories:       Category[]
  activeCategories: string[]
  onToggleCategory: (id: string) => void
  onClear:          () => void
}

export default function CategoryFilter({ categories, activeCategories, onToggleCategory, onClear }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (categories.length === 0) return null

  return (
    <div className="mb-4 w-full relative" ref={dropdownRef}>
      <div className="flex items-center justify-between gap-2">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-container-low border border-border-subtle hover:bg-surface-container transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
            <span className="font-body-md font-semibold text-on-surface">
              {activeCategories.length > 0 ? `Filtruj kategorie (${activeCategories.length})` : 'Filtruj kategorie'}
            </span>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {activeCategories.length > 0 && (
          <button 
            onClick={onClear} 
            className="px-3 py-2.5 rounded-xl bg-error-container/20 text-error font-semibold text-[13px] hover:bg-error-container/30 transition-colors"
          >
            Wyczyść
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-surface-container-lowest border border-border-subtle rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors select-none">
                <input 
                  type="checkbox" 
                  checked={activeCategories.includes(cat.id)} 
                  onChange={() => onToggleCategory(cat.id)} 
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-surface-container-lowest"
                />
                <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: cat.color ? `${cat.color}33` : '#eef6ee' }}>
                  {cat.emoji}
                </div>
                <span className="font-body-md text-on-surface truncate">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
