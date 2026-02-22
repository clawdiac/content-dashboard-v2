"use client"

import { MODEL_REGISTRY, type ModelConfig, type ModelId } from "@/lib/models"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { KlingCameraControl } from "@/components/generation/KlingCameraControl"

interface ModelConfigPanelProps {
  modelId: ModelId
  config: ModelConfig
  onChange: (config: ModelConfig) => void
}

export function ModelConfigPanel({ modelId, config, onChange }: ModelConfigPanelProps) {
  const spec = MODEL_REGISTRY[modelId]

  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value } as ModelConfig)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {spec.params.map((param) => {
        const value = (config as any)[param.key]

        if (param.type === "select") {
          return (
            <div key={param.key} className="grid gap-2">
              <Label htmlFor={param.key}>{param.label}</Label>
              <Select
                id={param.key}
                value={value ?? ""}
                onChange={(event) => {
                  const next = event.target.value
                  if (param.key === 'camera_control') {
                    updateConfig(param.key, next === "" ? null : next)
                  } else {
                    updateConfig(param.key, next)
                  }
                }}
              >
                {param.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )
        }

        if (param.type === "toggle") {
          const checked = Boolean(value)
          return (
            <div key={param.key} className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
              <div>
                <div className="text-sm font-medium">{param.label}</div>
                {param.description ? <div className="text-xs text-muted-foreground">{param.description}</div> : null}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={`${param.label} toggle`}
                onClick={() => updateConfig(param.key, !checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          )
        }

        if (param.type === "number") {
          return (
            <div key={param.key} className="grid gap-2">
              <Label htmlFor={param.key}>{param.label}</Label>
              <Input
                id={param.key}
                type="number"
                min={param.min}
                max={param.max}
                step={param.step}
                value={value ?? ""}
                onChange={(event) => {
                  const raw = event.target.value
                  updateConfig(param.key, raw === "" ? null : Number(raw))
                }}
              />
              {param.description ? <div className="text-xs text-muted-foreground">{param.description}</div> : null}
            </div>
          )
        }

        if (param.type === "text") {
          return (
            <div key={param.key} className="grid gap-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor={param.key}>{param.label}</Label>
              <Textarea
                id={param.key}
                value={value ?? ""}
                onChange={(event) => updateConfig(param.key, event.target.value)}
                placeholder={param.description}
              />
            </div>
          )
        }

        if (param.type === "slider") {
          const sliderValue = typeof value === "number" ? value : param.default
          return (
            <div key={param.key} className="grid gap-2">
              <Label htmlFor={param.key}>{param.label}</Label>
              <div className="flex items-center gap-3">
                <input
                  id={param.key}
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={sliderValue}
                  onChange={(event) => updateConfig(param.key, Number(event.target.value))}
                  className="w-full"
                />
                <div className="w-12 text-xs text-muted-foreground text-right">
                  {sliderValue}
                </div>
              </div>
              {param.description ? <div className="text-xs text-muted-foreground">{param.description}</div> : null}
            </div>
          )
        }

        if (param.type === "camera-6axis") {
          return (
            <div key={param.key} className="grid gap-2 sm:col-span-2 lg:col-span-3">
              <Label>{param.label}</Label>
              <KlingCameraControl
                value={value ?? null}
                onChange={(next) => updateConfig(param.key, next)}
              />
              {param.description ? <div className="text-xs text-muted-foreground">{param.description}</div> : null}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
