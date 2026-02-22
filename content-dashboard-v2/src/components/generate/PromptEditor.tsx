'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  negativePrompt: string
  onNegativeChange: (value: string) => void
  maxLength?: number
}

const TEMPLATE_VARS = [
  { token: '@character', label: 'Character name' },
  { token: '@preset', label: 'Preset name' },
  { token: '@setting', label: 'Scene setting' },
]

const SAVED_PROMPTS_KEY = 'generate-saved-prompts'

function getSavedPrompts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_PROMPTS_KEY) || '[]')
  } catch {
    return []
  }
}

function savePrompt(prompt: string) {
  const saved = getSavedPrompts()
  const updated = [prompt, ...saved.filter((p) => p !== prompt)].slice(0, 10)
  localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updated))
}

export function PromptEditor({ value, onChange, negativePrompt, onNegativeChange, maxLength = 2000 }: PromptEditorProps) {
  const [showNegative, setShowNegative] = useState(!!negativePrompt)
  const [showSaved, setShowSaved] = useState(false)
  const [savedPrompts, setSavedPrompts] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setSavedPrompts(getSavedPrompts())
  }, [])

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

  const handleSave = () => {
    if (value.trim()) {
      savePrompt(value.trim())
      setSavedPrompts(getSavedPrompts())
    }
  }

  const charCount = value.length
  const isOverLimit = charCount > maxLength

  return (
    <div className="space-y-3">
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
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowSaved(!showSaved)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showSaved ? 'Hide' : 'Saved'} ({savedPrompts.length})
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!value.trim()}
          className="text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
        >
          Save
        </button>
      </div>

      {/* Saved prompts dropdown */}
      {showSaved && savedPrompts.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 max-h-32 overflow-y-auto">
          {savedPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(p); setShowSaved(false) }}
              className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground truncate border-b last:border-0 border-border/50 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Main prompt */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the scene, camera angle, lighting, mood…"
          rows={4}
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[100px]',
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

      {/* Negative prompt toggle + editor */}
      <div>
        <button
          type="button"
          onClick={() => setShowNegative(!showNegative)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className={cn('h-3 w-3 transition-transform', showNegative && 'rotate-90')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Negative prompt
        </button>
        {showNegative && (
          <textarea
            value={negativePrompt}
            onChange={(e) => onNegativeChange(e.target.value)}
            placeholder="Blur, low-res, artifacts, deformed…"
            rows={2}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        )}
      </div>
    </div>
  )
}
