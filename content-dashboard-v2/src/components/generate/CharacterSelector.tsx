'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Character } from '@/types'

interface CharacterSelectorProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function CharacterSelector({ selectedIds, onChange }: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetch('/api/characters')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load characters (${r.status})`)
        return r.json()
      })
      .then((data) => {
        if (active) setCharacters(data.characters ?? data ?? [])
      })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : 'Failed to load characters') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retryCount])

  const filtered = useMemo(() => {
    if (!search.trim()) return characters
    const q = search.toLowerCase()
    return characters.filter(
      (c) => c.name.toLowerCase().includes(q) || c.displayName.toLowerCase().includes(q)
    )
  }, [characters, search])

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    )
  }

  const selectAll = () => {
    onChange(filtered.map((c) => c.id))
  }

  const selectNone = () => {
    onChange([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
        Loading characters…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-sm text-center">
        <div className="text-destructive mb-2">{error}</div>
        <button
          type="button"
          onClick={() => setRetryCount((c) => c + 1)}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search characters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          All
        </button>
        <button
          type="button"
          onClick={selectNone}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          None
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((char) => {
            const selected = selectedIds.includes(char.id)
            return (
              <motion.button
                key={char.id}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={() => toggle(char.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all',
                  selected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                {char.avatarUrl ? (
                  <img
                    src={char.avatarUrl}
                    alt={char.displayName}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {char.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{char.displayName}</div>
                </div>
                <div
                  className={cn(
                    'h-4 w-4 rounded border-2 flex-shrink-0 transition-colors flex items-center justify-center',
                    selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                  )}
                >
                  {selected && (
                    <svg className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {selectedIds.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedIds.length} character{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
