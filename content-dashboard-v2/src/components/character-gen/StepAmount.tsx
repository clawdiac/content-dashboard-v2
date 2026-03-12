'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  amount: number
  namingMode: 'random' | 'prefix'
  namePrefix: string
  onAmountChange: (n: number) => void
  onNamingModeChange: (mode: 'random' | 'prefix') => void
  onNamePrefixChange: (prefix: string) => void
  onNext: () => void
  onBack: () => void
}

export function StepAmount({
  amount,
  namingMode,
  namePrefix,
  onAmountChange,
  onNamingModeChange,
  onNamePrefixChange,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Amount & Naming</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set how many characters to generate and how to name them.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Number of characters</Label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={100}
            value={amount}
            onChange={(e) => onAmountChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <Input
            type="number"
            min={5}
            max={100}
            value={amount}
            onChange={(e) => {
              const val = Math.min(100, Math.max(5, Number(e.target.value) || 5))
              onAmountChange(val)
            }}
            className="w-20"
          />
        </div>
        <p className="text-xs text-muted-foreground">Min 5, max 100 characters</p>
      </div>

      <div className="space-y-3">
        <Label>Naming mode</Label>
        <div className="flex gap-2">
          <Button
            variant={namingMode === 'random' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onNamingModeChange('random')}
          >
            Randomize Names
          </Button>
          <Button
            variant={namingMode === 'prefix' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onNamingModeChange('prefix')}
          >
            Custom Prefix
          </Button>
        </div>

        {namingMode === 'prefix' && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Name prefix</Label>
            <Input
              placeholder="e.g. Coca Cola"
              value={namePrefix}
              onChange={(e) => onNamePrefixChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Characters will be named "{namePrefix || 'Prefix'} 1", "{namePrefix || 'Prefix'} 2", etc.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={namingMode === 'prefix' && !namePrefix.trim()}>
          Next
        </Button>
      </div>
    </div>
  )
}
