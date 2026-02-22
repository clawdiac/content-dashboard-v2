"use client"

import { useEffect, useState } from "react"

import { Select, SelectItem } from "@/components/ui/select"

export type ReferenceOption = {
  id: string
  name: string
  imageUrl: string
  category?: string | null
}

type ReferenceSelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

export function ReferenceSelect({
  value,
  onChange,
  placeholder,
  id,
}: ReferenceSelectProps) {
  const [references, setReferences] = useState<ReferenceOption[]>([])

  useEffect(() => {
    let active = true

    const loadReferences = async () => {
      const response = await fetch("/api/references")
      if (!response.ok) return
      const data = (await response.json()) as ReferenceOption[]
      if (active) setReferences(data)
    }

    loadReferences()

    return () => {
      active = false
    }
  }, [])

  return (
    <Select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ?? "Select a reference"}
    >
      {references.map((reference) => (
        <SelectItem key={reference.id} value={reference.id}>
          {reference.name}
        </SelectItem>
      ))}
    </Select>
  )
}
