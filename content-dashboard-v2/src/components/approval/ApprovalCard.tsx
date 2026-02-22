'use client'

import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, X, RotateCcw } from 'lucide-react'
import type { ApprovalItem, ApprovalStatus } from '@/types'

interface ApprovalCardProps {
  item: ApprovalItem
  selected: boolean
  focused: boolean
  onSelect: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

const statusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
}

const statusBorder: Record<ApprovalStatus, string> = {
  pending: 'border-border',
  approved: 'border-emerald-500/40',
  rejected: 'border-red-500/40',
}

export const ApprovalCard = memo(function ApprovalCard({
  item,
  selected,
  focused,
  onSelect,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const handleClick = useCallback(() => onSelect(item.id), [item.id, onSelect])
  const handleApprove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onApprove(item.id)
  }, [item.id, onApprove])
  const handleReject = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onReject(item.id)
  }, [item.id, onReject])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      role="gridcell"
      aria-selected={selected}
      tabIndex={focused ? 0 : -1}
      onClick={handleClick}
      className={cn(
        'group relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all',
        statusBorder[item.approvalStatus],
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        focused && 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background',
        'hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30',
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={`${item.character.displayName} - ${item.preset.displayName}`}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No preview
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <div className={cn(
            'h-3 w-3 rounded-full shadow-md',
            statusColors[item.approvalStatus],
          )} />
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={handleApprove}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-all',
              item.approvalStatus === 'approved'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/90 text-emerald-600 hover:bg-emerald-500 hover:text-white',
            )}
            title="Approve (Space)"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleReject}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-all',
              item.approvalStatus === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-red-600 hover:bg-red-500 hover:text-white',
            )}
            title="Reject (X)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-2.5 py-2 bg-card">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-medium truncate">{item.character.displayName}</span>
          <span className="text-[10px] text-muted-foreground capitalize">{item.approvalStatus}</span>
        </div>
        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
          {item.preset.displayName || item.preset.name}
        </div>
      </div>
    </motion.div>
  )
})
