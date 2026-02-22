"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { MODEL_REGISTRY, type ModelId, type ModelType } from "@/lib/models"

interface AvailableModel {
  id: ModelId
  available: boolean
}

interface ModelSelectorProps {
  value: ModelId
  onChange: (modelId: ModelId) => void
  filter?: ModelType
}

export function ModelSelector({ value, onChange, filter }: ModelSelectorProps) {
  const [availability, setAvailability] = useState<Record<ModelId, boolean>>({
    nano_banana_pro: true,
    seedance: true,
    kling: true,
  })

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      try {
        const query = filter ? `?type=${filter}` : ""
        const res = await fetch(`/api/models${query}`, { signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        const models = (data?.models || []) as Array<AvailableModel>
        setAvailability((prev) => {
          const next = { ...prev }
          for (const model of models) {
            next[model.id] = !!model.available
          }
          return next
        })
      } catch {
        // ignore fetch failures
      }
    }
    run()
    return () => controller.abort()
  }, [filter])

  const models = useMemo(() => {
    const entries = Object.values(MODEL_REGISTRY)
    return filter ? entries.filter(m => m.type === filter) : entries
  }, [filter])

  const selectedSpec = MODEL_REGISTRY[value]

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {models.map((model) => {
          const isAvailable = availability[model.id]
          const isSelected = value === model.id
          return (
            <Button
              key={model.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onChange(model.id)}
              disabled={!isAvailable}
              title={!isAvailable ? `Missing env keys: ${model.envKeys.join(", ")}` : undefined}
              className="capitalize"
            >
              {model.name}
            </Button>
          )
        })}
      </div>
      <div className="text-xs text-muted-foreground">
        {selectedSpec?.costEstimate}
      </div>
    </div>
  )
}
