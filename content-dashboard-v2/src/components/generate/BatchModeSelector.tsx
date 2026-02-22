'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { BatchType } from '@/types'

interface BatchModeSelectorProps {
  value: BatchType
  onChange: (mode: BatchType) => void
}

const modes: { value: BatchType; label: string; description: string; icon: React.ReactNode; workflow: string }[] = [
  {
    value: 'image',
    label: 'Images Only',
    description: 'Generate images for selected characters',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    workflow: 'Prompt → Image Generation → Approval',
  },
  {
    value: 'video',
    label: 'Videos Only',
    description: 'Skip images, generate videos directly',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    workflow: 'Prompt → Video Generation → Approval',
  },
  {
    value: 'mixed',
    label: 'Images → Videos',
    description: 'Generate images first, then create videos from them',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
    workflow: 'Prompt → Images → Approve → Video Gen → Final Approval',
  },
]

export function BatchModeSelector({ value, onChange }: BatchModeSelectorProps) {
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
              <div className="text-sm font-medium">{mode.label}</div>
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
