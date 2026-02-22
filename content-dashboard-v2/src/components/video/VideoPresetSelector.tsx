'use client'

import { useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/store/config'
import type { VideoPreset } from '@/types'

interface VideoPresetSelectorProps {
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

const PresetCard = memo(function PresetCard({
  preset,
  isSelected,
  onToggle,
}: {
  preset: VideoPreset
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
        {preset.thumbnailUrl ? (
          <img src={preset.thumbnailUrl} alt={preset.displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg className="h-5 w-5 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{preset.displayName}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {preset.model}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {preset.duration}s
          </span>
          <span className="text-[10px] text-muted-foreground">
            {preset.width}×{preset.height}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {preset.fps}fps
          </span>
        </div>
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

export function VideoPresetSelector({ selectedIds, onToggle }: VideoPresetSelectorProps) {
  const videoPresets = useConfigStore((s) => s.videoPresets)

  // Group by model
  const grouped = useMemo(() => {
    const groups: Record<string, VideoPreset[]> = {}
    for (const p of videoPresets) {
      const key = p.model || 'Other'
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    }
    return groups
  }, [videoPresets])

  if (videoPresets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-8 text-center">
        <svg className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <div className="text-sm text-muted-foreground">No video presets configured</div>
        <div className="text-xs text-muted-foreground/60 mt-1">Add video presets in Settings</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {selectedIds.size} of {videoPresets.length} selected
      </div>

      {Object.entries(grouped).map(([model, presets]) => (
        <div key={model} className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{model}</div>
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {presets.map((preset) => (
                <PresetCard
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
