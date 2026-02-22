"use client"

import { useEffect, useState } from "react"

import { Select, SelectItem } from "@/components/ui/select"

export type PresetOption = {
  id: string
  name: string
  imageUrl: string
}

type PresetSelectProps = {
  characterId: string
  value: string
  onChange: (value: string, imageUrl: string) => void
  placeholder?: string
  id?: string
}

export function PresetSelect({
  characterId,
  value,
  onChange,
  placeholder,
  id,
}: PresetSelectProps) {
  const [presets, setPresets] = useState<PresetOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!characterId) {
      setPresets([])
      return
    }

    let active = true
    setLoading(true)

    const loadPresets = async () => {
      try {
        const response = await fetch(`/api/characters/${characterId}`)
        if (!response.ok) return
        const data = await response.json()
        if (active) {
          setPresets(data.presets || [])
        }
      } catch (err) {
        console.error("Failed to load presets:", err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPresets()

    return () => {
      active = false
    }
  }, [characterId])

  const handleChange = (newValue: string) => {
    const preset = presets.find(p => p.id === newValue)
    if (preset) {
      onChange(newValue, preset.imageUrl)
    }
  }

  if (!characterId) {
    return null
  }

  if (loading) {
    return (
      <Select id={id} value="" disabled>
        <SelectItem value="">Loading...</SelectItem>
      </Select>
    )
  }

  if (presets.length === 0) {
    return (
      <Select id={id} value="" disabled>
        <SelectItem value="">No presets for this character</SelectItem>
      </Select>
    )
  }

  return (
    <Select
      id={id}
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      placeholder={placeholder ?? "Select a preset"}
    >
      {presets.map((preset) => (
        <SelectItem key={preset.id} value={preset.id}>
          {preset.name}
        </SelectItem>
      ))}
    </Select>
  )
}
