'use client'

import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

export interface QueueFilterState {
  types: string[]
}

const TYPES = ['image', 'video']

interface QueueFiltersProps {
  filters: QueueFilterState
  onChange: (filters: QueueFilterState) => void
}

export function QueueFilters({ filters, onChange }: QueueFiltersProps) {
  const toggleType = useCallback((type: string) => {
    const types = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type]
    onChange({ ...filters, types })
  }, [filters, onChange])

  const clearFilters = useCallback(() => {
    onChange({ types: [] })
  }, [onChange])

  const hasFilters = filters.types.length > 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Type:</span>
      {TYPES.map((type) => (
        <Badge
          key={type}
          variant={filters.types.includes(type) ? 'default' : 'outline'}
          className="cursor-pointer capitalize"
          onClick={() => toggleType(type)}
        >
          {type}
        </Badge>
      ))}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  )
}
