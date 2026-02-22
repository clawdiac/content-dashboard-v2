"use client"

import { useEffect, useState } from "react"

import { Select, SelectItem } from "@/components/ui/select"

export type CharacterOption = {
  id: string
  name: string
  description?: string | null
}

type CharacterSelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

export function CharacterSelect({
  value,
  onChange,
  placeholder,
  id,
}: CharacterSelectProps) {
  const [characters, setCharacters] = useState<CharacterOption[]>([])

  useEffect(() => {
    let active = true

    const loadCharacters = async () => {
      const response = await fetch("/api/characters")
      if (!response.ok) return
      const data = (await response.json()) as CharacterOption[]
      if (active) setCharacters(data)
    }

    loadCharacters()

    return () => {
      active = false
    }
  }, [])

  return (
    <Select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ?? "Select a character"}
    >
      {characters.map((character) => (
        <SelectItem key={character.id} value={character.id}>
          {character.name}
        </SelectItem>
      ))}
    </Select>
  )
}
