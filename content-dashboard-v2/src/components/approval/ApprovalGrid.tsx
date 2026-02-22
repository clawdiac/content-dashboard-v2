'use client'

import { useCallback, useMemo, useRef } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import { AnimatePresence } from 'framer-motion'
import { ApprovalCard } from './ApprovalCard'
import type { ApprovalItem } from '@/types'

interface ApprovalGridProps {
  items: ApprovalItem[]
  selectedIds: Set<string>
  focusedId: string | null
  onSelect: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

function GridContainer({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
    >
      {children}
    </div>
  )
}

function ItemWrapper({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>
}

export function ApprovalGrid({
  items,
  selectedIds,
  focusedId,
  onSelect,
  onApprove,
  onReject,
}: ApprovalGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const itemContent = useCallback(
    (index: number) => {
      const item = items[index]
      if (!item) return null
      return (
        <ApprovalCard
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          focused={focusedId === item.id}
          onSelect={onSelect}
          onApprove={onApprove}
          onReject={onReject}
        />
      )
    },
    [items, selectedIds, focusedId, onSelect, onApprove, onReject],
  )

  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">No items match your filter</p>
      </div>
    )
  }

  return (
    <div ref={gridRef} className="h-full">
      <VirtuosoGrid
        totalCount={items.length}
        overscan={200}
        components={{
          List: GridContainer as any,
          Item: ItemWrapper as any,
        }}
        itemContent={itemContent}
        style={{ height: '100%' }}
      />
    </div>
  )
}
