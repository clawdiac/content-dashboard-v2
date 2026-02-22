'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type VideoMode = 'from-images' | 'from-presets' | 'mixed'

interface VideoModeSelectorProps {
  value: VideoMode
  onChange: (mode: VideoMode) => void
}

const modes: { value: VideoMode; label: string; description: string; workflow: string; icon: React.ReactNode }[] = [
  {
    value: 'from-images',
    label: 'From Approved Images',
    description: 'Convert approved images into videos',
    workflow: 'Approved Images → Seedance/Kling → Video',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'from-presets',
    label: 'From Video Presets',
    description: 'Use preset reference images directly',
    workflow: 'Video Presets → Seedance/Kling → Video',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'Combine approved images + video presets',
    workflow: 'Images + Presets → Seedance/Kling → Videos',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
  },
]

export function VideoModeSelector({ value, onChange }: VideoModeSelectorProps) {
  const selected = modes.find((m) => m.value === value) ?? modes[0]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {modes.map((mode) => {
          const isSelected = value === mode.value
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 transition-all text-center',
                isSelected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              )}
            >
              <div className={cn('transition-colors', isSelected ? 'text-primary' : 'text-muted-foreground')}>
                {mode.icon}
              </div>
              <div className="text-xs font-medium leading-tight">{mode.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{mode.description}</div>
            </button>
          )
        })}
      </div>

      <motion.div
        key={selected.value}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
      >
        <svg className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span className="text-xs text-muted-foreground">{selected.workflow}</span>
      </motion.div>
    </div>
  )
}
