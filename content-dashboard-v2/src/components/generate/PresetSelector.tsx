'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Preset {
  id: string
  name: string
  imageUrl?: string
  displayName?: string
}

interface PresetSelectorProps {
  characterIds: string[]
  selectedPresetId: string | null
  onChange: (presetId: string | null, preset: Preset | null) => void
}

interface CharacterPresets {
  characterId: string
  characterName: string
  presets: Preset[]
}

export function PresetSelector({ characterIds, selectedPresetId, onChange }: PresetSelectorProps) {
  const [grouped, setGrouped] = useState<CharacterPresets[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (characterIds.length === 0) {
      setGrouped([])
      return
    }

    const controller = new AbortController()
    setLoading(true)

    Promise.all(
      characterIds.map(async (id) => {
        const res = await fetch(`/api/characters/${id}`, { signal: controller.signal })
        if (!res.ok) return null
        const data = await res.json()
        return {
          characterId: id,
          characterName: data.name || data.displayName || id,
          presets: (data.presets || []) as Preset[],
        }
      })
    )
      .then((results) => {
        if (!controller.signal.aborted) setGrouped(results.filter(Boolean) as CharacterPresets[])
      })
      .catch((e) => { if (e.name !== 'AbortError') console.error(e) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => { controller.abort() }
  }, [characterIds])

  const allPresets = grouped.flatMap((g) => g.presets)

  if (characterIds.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Select characters first to see their presets
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
        Loading presets…
      </div>
    )
  }

  if (allPresets.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No presets available for selected characters
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.characterId} className="space-y-2">
          {grouped.length > 1 && (
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.characterName}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.presets.map((preset) => {
              const selected = selectedPresetId === preset.id
              return (
                <motion.button
                  key={preset.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onChange(selected ? null : preset.id, selected ? null : preset)}
                  className={cn(
                    'relative rounded-lg border overflow-hidden transition-all text-left',
                    selected
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {preset.imageUrl ? (
                    <div className="aspect-[3/4] relative bg-muted">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="text-xs font-medium text-white truncate">
                          {preset.displayName || preset.name}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] flex items-center justify-center bg-muted/50 p-3">
                      <div className="text-sm font-medium text-center truncate">
                        {preset.displayName || preset.name}
                      </div>
                    </div>
                  )}
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
