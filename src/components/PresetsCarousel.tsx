'use client'

import { useState, FormEvent } from 'react'
import type { Preset } from '@/lib/types'

interface Props {
  presets: Preset[]
  onApplyPreset: (preset: Preset) => void
  onSaveAsPreset: (name: string) => void
}

export default function PresetsCarousel({ presets, onApplyPreset, onSaveAsPreset }: Props) {
  const [isSaving, setIsSaving] = useState(false)
  const [presetName, setPresetName] = useState('')

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!presetName.trim()) return
    onSaveAsPreset(presetName.trim())
    setPresetName('')
    setIsSaving(false)
  }

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="font-headline-sm text-[16px] font-semibold text-on-surface">Szablony zakupowe</h3>
        {!isSaving && (
          <button 
            onClick={() => setIsSaving(true)}
            className="text-[12px] font-medium text-primary flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Zapisz jako szablon
          </button>
        )}
      </div>

      {isSaving && (
        <form onSubmit={handleSave} className="flex gap-2 mb-3 px-1 animate-in slide-in-from-top-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Nazwa szablonu (np. Obiad)"
            autoFocus
            className="flex-1 bg-surface-container-lowest border border-border-subtle rounded-xl px-3 py-1.5 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button type="submit" disabled={!presetName.trim()} className="bg-primary text-on-primary px-3 py-1.5 rounded-xl text-[14px] font-medium disabled:opacity-50">
            Zapisz
          </button>
          <button type="button" onClick={() => setIsSaving(false)} className="bg-surface-container text-on-surface px-3 py-1.5 rounded-xl text-[14px] font-medium">
            Anuluj
          </button>
        </form>
      )}

      {presets.length > 0 ? (
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide px-1">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className="whitespace-nowrap flex-shrink-0 bg-surface-container-low hover:bg-surface-container border border-border-subtle text-on-surface px-4 py-2 rounded-xl text-[14px] font-medium transition-colors active:scale-95"
            >
              {preset.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-on-surface-variant px-1">Brak zapisanych szablonów.</p>
      )}
    </div>
  )
}
