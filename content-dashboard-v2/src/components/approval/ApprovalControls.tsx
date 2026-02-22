'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CheckSquare, XSquare, Trash2, Filter, ArrowDownAZ, SendHorizonal } from 'lucide-react'
import type { ApprovalFilter, ApprovalStatus } from '@/types'

interface ApprovalControlsProps {
  filter: ApprovalFilter
  onFilterChange: (filter: Partial<ApprovalFilter>) => void
  counts: { total: number; pending: number; approved: number; rejected: number }
  selectedCount: number
  onApproveAll: () => void
  onRejectAll: () => void
  onClearRejected: () => void
  onSendToVideo: () => void
}

const statusTabs: { value: ApprovalFilter['status']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const sortOptions: { value: ApprovalFilter['sortBy']; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'character', label: 'Character' },
  { value: 'preset', label: 'Preset' },
]

export function ApprovalControls({
  filter,
  onFilterChange,
  counts,
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClearRejected,
  onSendToVideo,
}: ApprovalControlsProps) {
  return (
    <div className="space-y-3">
      {/* Status tabs + counts */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
          {statusTabs.map((tab) => {
            const count = tab.value === 'all' ? counts.total
              : tab.value === 'pending' ? counts.pending
              : tab.value === 'approved' ? counts.approved
              : counts.rejected
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onFilterChange({ status: tab.value })}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  filter.status === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                <span className={cn(
                  'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                  filter.status === tab.value
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto">
          <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={filter.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as ApprovalFilter['sortBy'] })}
            className="bg-transparent text-xs text-muted-foreground border-none outline-none cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onApproveAll}
          className="gap-1.5 text-xs"
        >
          <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
          {selectedCount > 0 ? `Approve ${selectedCount}` : 'Approve All Visible'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRejectAll}
          className="gap-1.5 text-xs"
        >
          <XSquare className="h-3.5 w-3.5 text-red-500" />
          {selectedCount > 0 ? `Reject ${selectedCount}` : 'Reject All Visible'}
        </Button>
        {counts.rejected > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearRejected}
            className="gap-1.5 text-xs text-muted-foreground"
            title="Hides rejected items from view"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hide Rejected
          </Button>
        )}
        {counts.approved > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={onSendToVideo}
            className="gap-1.5 text-xs ml-auto"
          >
            <SendHorizonal className="h-3.5 w-3.5" />
            Send to Video ({counts.approved})
          </Button>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span><kbd className="rounded bg-muted px-1 py-0.5 font-mono">←→↑↓</kbd> Navigate</span>
        <span><kbd className="rounded bg-muted px-1 py-0.5 font-mono">Space</kbd> Approve</span>
        <span><kbd className="rounded bg-muted px-1 py-0.5 font-mono">X</kbd> Reject</span>
        <span><kbd className="rounded bg-muted px-1 py-0.5 font-mono">Z</kbd> Undo</span>
        <span><kbd className="rounded bg-muted px-1 py-0.5 font-mono">Enter</kbd> Preview</span>
        <span><kbd className="rounded bg-muted px-1 py-0.5 font-mono">A</kbd> Select All</span>
      </div>
    </div>
  )
}
