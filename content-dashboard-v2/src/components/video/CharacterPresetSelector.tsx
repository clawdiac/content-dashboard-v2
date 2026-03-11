'use client'

import { useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/store/config'
import type { CharacterPresetWithCharacter } from '@/store/config'

interface CharacterPresetSelectorProps {
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

const CharPresetCard = memo(function CharPresetCard({
  preset,
  isSelected,
  onToggle,
}: {
  preset: CharacterPresetWithCharacter
  isSelected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={() => onToggle(preset.id)}
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-border hover:border-primary/40 hover:bg-muted/50'
      )}
    >
      {/* Thumbnail */}
      <div className="h-12 w-12 rounded-md border border-border overflow-hidden flex-shrink-0 bg-muted">
        {preset.imageUrl ? (
          <img src={preset.imageUrl} alt={preset.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg className="h-5 w-5 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{preset.name}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{preset.character.name}</div>
      </div>

      {/* Checkmark */}
      <div
        className={cn(
          'h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isSelected && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </motion.button>
  )
})

export function CharacterPresetSelector({ selectedIds, onToggle }: CharacterPresetSelectorProps) {
  const characterPresets = useConfigStore((s) => s.characterPresets)

  // Group by character name
  const grouped = useMemo(() => {
    const groups: Record<string, CharacterPresetWithCharacter[]> = {}
    for (const p of characterPresets) {
      const key = p.character?.name || 'Unknown'
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    }
    return groups
  }, [characterPresets])

  if (characterPresets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-8 text-center">
        <svg className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="text-sm text-muted-foreground">No character presets found</div>
        <div className="text-xs text-muted-foreground/60 mt-1">Create presets in the Generate page</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {selectedIds.size} of {characterPresets.length} selected
      </div>

      {Object.entries(grouped).map(([characterName, presets]) => (
        <div key={characterName} className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{characterName}</div>
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {presets.map((preset) => (
                <CharPresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedIds.has(preset.id)}
                  onToggle={onToggle}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  )
}
