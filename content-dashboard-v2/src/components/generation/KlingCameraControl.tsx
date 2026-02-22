"use client"

import type { KlingAdvancedCamera } from "@/lib/models"

interface KlingCameraControlProps {
  value: KlingAdvancedCamera | null
  onChange: (value: KlingAdvancedCamera | null) => void
}

const AXES: Array<{ key: keyof KlingAdvancedCamera; label: string }> = [
  { key: "horizontal", label: "Horizontal" },
  { key: "vertical", label: "Vertical" },
  { key: "pan", label: "Pan" },
  { key: "tilt", label: "Tilt" },
  { key: "roll", label: "Roll" },
  { key: "zoom", label: "Zoom" },
]

const DEFAULT_CAMERA: KlingAdvancedCamera = {
  horizontal: 0,
  vertical: 0,
  pan: 0,
  tilt: 0,
  roll: 0,
  zoom: 0,
}

export function KlingCameraControl({ value, onChange }: KlingCameraControlProps) {
  const enabled = !!value

  const handleToggle = () => {
    if (enabled) {
      onChange(null)
    } else {
      onChange({ ...DEFAULT_CAMERA })
    }
  }

  const handleAxisChange = (key: keyof KlingAdvancedCamera, next: number) => {
    if (!value) return
    onChange({ ...value, [key]: next })
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Enable Advanced Camera</div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable advanced camera"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {enabled && value ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {AXES.map((axis) => (
            <label key={axis.key} className="grid gap-1 text-xs">
              <span className="text-muted-foreground">{axis.label}: {value[axis.key]}</span>
              <input
                type="range"
                min={-10}
                max={10}
                step={1}
                value={value[axis.key]}
                onChange={(event) => handleAxisChange(axis.key, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
