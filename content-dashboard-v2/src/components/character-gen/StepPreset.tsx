'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  presetName: string
  onPresetNameChange: (name: string) => void
  onGeneratePreview: () => void
  onBack: () => void
}

export function StepPreset({
  presetName,
  onPresetNameChange,
  onGeneratePreview,
  onBack,
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    fetch('/api/presets')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        const names = data.map((p) => p.name).filter(Boolean)
        setSuggestions([...new Set(names)] as string[])
      })
      .catch(() => {})
  }, [])

  const filteredSuggestions = presetName
    ? suggestions.filter((s) => s.toLowerCase().includes(presetName.toLowerCase()))
    : suggestions

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Preset Name</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Name the preset that will be created for each generated character.
        </p>
      </div>

      <div className="space-y-2 relative">
        <Label>Preset name</Label>
        <Input
          placeholder="e.g. Studio Portrait, UGC Creator..."
          value={presetName}
          onChange={(e) => onPresetNameChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          autoComplete="off"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 rounded-md border bg-popover shadow-md">
            {filteredSuggestions.slice(0, 6).map((s) => (
              <button
                key={s}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={() => {
                  onPresetNameChange(s)
                  setShowSuggestions(false)
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onGeneratePreview} disabled={!presetName.trim()}>
          Generate Preview
        </Button>
      </div>
    </div>
  )
}
