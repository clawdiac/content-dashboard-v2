'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

interface VideoPromptEditorProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  // Advanced overrides
  seed?: number
  onSeedChange: (seed: number | undefined) => void
  durationOverride?: number
  onDurationChange: (duration: number | undefined) => void
  aspectRatioOverride?: string
  onAspectRatioChange: (ratio: string | undefined) => void
  videoModel: string
  onVideoModelChange: (model: string) => void
}

const TEMPLATE_VARS = [
  { token: '@character', label: 'Character name' },
  { token: '@preset', label: 'Preset name' },
]

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4']
const VIDEO_MODELS = ['seedance', 'kling']

export function VideoPromptEditor({
  value,
  onChange,
  maxLength = 2000,
  seed,
  onSeedChange,
  durationOverride,
  onDurationChange,
  aspectRatioOverride,
  onAspectRatioChange,
  videoModel,
  onVideoModelChange,
}: VideoPromptEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertTemplate = useCallback((token: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newVal = value.slice(0, start) + token + value.slice(end)
    onChange(newVal)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + token.length
      ta.focus()
    })
  }, [value, onChange])

  const charCount = value.length
  const isOverLimit = charCount > maxLength

  return (
    <div className="space-y-3">
      {/* Video model selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Model:</span>
        <div className="flex rounded-md border border-border overflow-hidden">
          {VIDEO_MODELS.map((model) => (
            <button
              key={model}
              type="button"
              onClick={() => onVideoModelChange(model)}
              className={cn(
                'px-3 py-1 text-xs font-medium capitalize transition-colors',
                videoModel === model
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      {/* Template variables */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Insert:</span>
        {TEMPLATE_VARS.map((v) => (
          <button
            key={v.token}
            type="button"
            onClick={() => insertTemplate(v.token)}
            className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            title={v.label}
          >
            {v.token}
          </button>
        ))}
      </div>

      {/* Main prompt */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the motion, camera movement, action…"
          rows={3}
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[80px]',
            isOverLimit ? 'border-destructive' : 'border-border'
          )}
        />
        <div className={cn(
          'absolute bottom-2 right-2 text-[10px] tabular-nums',
          isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground/60'
        )}>
          {charCount}/{maxLength}
        </div>
      </div>

      {/* Advanced options toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className={cn('h-3 w-3 transition-transform', showAdvanced && 'rotate-90')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            {/* Seed */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground w-20 flex-shrink-0">Seed</label>
              <input
                type="number"
                value={seed ?? ''}
                onChange={(e) => onSeedChange(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Random"
                className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Duration override */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground w-20 flex-shrink-0">Duration (s)</label>
              <input
                type="number"
                value={durationOverride ?? ''}
                onChange={(e) => onDurationChange(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Preset default"
                min={1}
                max={30}
                className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Aspect ratio override */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground w-20 flex-shrink-0">Aspect ratio</label>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onAspectRatioChange(undefined)}
                  className={cn(
                    'rounded-md px-2 py-1 text-[10px] font-medium border transition-colors',
                    !aspectRatioOverride
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  Default
                </button>
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onAspectRatioChange(ratio)}
                    className={cn(
                      'rounded-md px-2 py-1 text-[10px] font-medium border transition-colors',
                      aspectRatioOverride === ratio
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
