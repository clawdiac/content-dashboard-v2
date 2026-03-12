'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RandomizeConfig } from '@/lib/character-randomizer'

interface Props {
  config: RandomizeConfig
  onChange: (config: RandomizeConfig) => void
  onNext: () => void
  onBack: () => void
}

export function StepRandomize({ config, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null)

  const update = (partial: Partial<RandomizeConfig>) => {
    onChange({ ...config, ...partial })
  }

  const handleNext = () => {
    if (config.clothes.enabled && !config.clothes.description.trim()) {
      setError('Clothes description is required when clothes randomization is enabled.')
      return
    }
    setError(null)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Randomization</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which traits to randomize across generated characters.
        </p>
      </div>

      <div className="space-y-5">
        {/* Ethnicity */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ethnicity-toggle"
              checked={config.ethnicity.enabled}
              onChange={(e) =>
                update({ ethnicity: { ...config.ethnicity, enabled: e.target.checked } })
              }
              className="h-4 w-4 rounded border accent-primary"
            />
            <Label htmlFor="ethnicity-toggle" className="font-medium cursor-pointer">
              Randomize Ethnicity
            </Label>
          </div>
          {config.ethnicity.enabled && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Specific ethnicity (optional — leave blank for random)
              </Label>
              <Input
                placeholder="e.g. East Asian, African American, Latina..."
                value={config.ethnicity.description || ''}
                onChange={(e) =>
                  update({ ethnicity: { ...config.ethnicity, description: e.target.value } })
                }
              />
            </div>
          )}
        </div>

        {/* Hairstyle */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hairstyle-toggle"
              checked={config.hairstyle.enabled}
              onChange={(e) =>
                update({ hairstyle: { ...config.hairstyle, enabled: e.target.checked } })
              }
              className="h-4 w-4 rounded border accent-primary"
            />
            <Label htmlFor="hairstyle-toggle" className="font-medium cursor-pointer">
              Randomize Hairstyle
            </Label>
          </div>
          {config.hairstyle.enabled && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Specific hairstyle (optional — leave blank for random)
              </Label>
              <Input
                placeholder="e.g. long curly blonde, short black bob..."
                value={config.hairstyle.description || ''}
                onChange={(e) =>
                  update({ hairstyle: { ...config.hairstyle, description: e.target.value } })
                }
              />
            </div>
          )}
        </div>

        {/* Clothes */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="clothes-toggle"
              checked={config.clothes.enabled}
              onChange={(e) =>
                update({ clothes: { ...config.clothes, enabled: e.target.checked } })
              }
              className="h-4 w-4 rounded border accent-primary"
            />
            <Label htmlFor="clothes-toggle" className="font-medium cursor-pointer">
              Override Clothes
            </Label>
          </div>
          {config.clothes.enabled && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Clothes description <span className="text-destructive">*required</span>
              </Label>
              <Input
                placeholder="e.g. casual denim jacket and white t-shirt..."
                value={config.clothes.description}
                onChange={(e) =>
                  update({ clothes: { ...config.clothes, description: e.target.value } })
                }
              />
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}
