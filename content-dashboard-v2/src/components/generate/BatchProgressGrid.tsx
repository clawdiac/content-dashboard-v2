'use client'

import { useState, useCallback, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { BatchStats } from '@/types'

export type BatchItemStatus = 'pending' | 'queued' | 'generating' | 'completed' | 'failed'

export interface BatchItem {
  id: string
  title: string
  characterName?: string
  status: BatchItemStatus
  progress: number
  thumbnailUrl?: string
  outputUrl?: string
  outputCount?: number
  etaSeconds?: number | null
  error?: string
}

interface BatchProgressGridProps {
  items: BatchItem[]
  stats: BatchStats | null
  onStop?: () => void
  onPause?: () => void
  onRetry?: (itemId: string) => void
  isRunning: boolean
}

const statusConfig: Record<BatchItemStatus, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-muted-foreground', bg: 'bg-muted/40', label: 'Pending' },
  queued: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Queued' },
  generating: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Generating' },
  completed: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Done' },
  failed: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Failed' },
}

const ItemCard = memo(function ItemCard({ item, onClick, onRetry }: { item: BatchItem; onClick: () => void; onRetry?: (id: string) => void }) {
  const config = statusConfig[item.status]
  const displayName = item.characterName || item.title

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-lg border overflow-hidden transition-all group',
        item.status === 'completed'
          ? 'border-border hover:border-primary/50'
          : 'border-border'
      )}
    >
      {/* Thumbnail or placeholder */}
      {item.thumbnailUrl ? (
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className={cn('absolute inset-0 flex items-center justify-center', config.bg)}>
          {item.status === 'generating' ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-[10px] font-medium text-blue-500 tabular-nums">{item.progress}%</span>
            </div>
          ) : item.status === 'failed' ? (
            <div className="flex flex-col items-center gap-1.5">
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {onRetry && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRetry(item.id) }}
                  className="text-[10px] font-medium text-red-400 hover:text-red-300 underline"
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          )}
        </div>
      )}

      {/* Progress bar for generating items */}
      {item.status === 'generating' && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-muted">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-1 left-1">
        <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium backdrop-blur-sm', config.color, config.bg)}>
          {config.label}
        </span>
      </div>

      {/* Meta overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
        <div className="text-[10px] font-medium text-white truncate">{displayName}</div>
        <div className="text-[9px] text-white/80 flex items-center gap-1.5">
          <span>{config.label}</span>
          {typeof item.outputCount === 'number' && (
            <span>• Outputs {item.outputCount}</span>
          )}
          {typeof item.etaSeconds === 'number' && item.etaSeconds >= 0 && (
            <span>• ETA {formatEta(item.etaSeconds)}</span>
          )}
        </div>
      </div>

      {/* Hover overlay for completed items */}
      {item.status === 'completed' && item.thumbnailUrl && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      )}
    </motion.button>
  )
}, (prev, next) =>
  prev.item.status === next.item.status &&
  prev.item.progress === next.item.progress &&
  prev.item.thumbnailUrl === next.item.thumbnailUrl &&
  prev.item.outputUrl === next.item.outputUrl
)

function formatEta(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return '--'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  if (minutes <= 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function ImageModal({ item, onClose }: { item: BatchItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative max-w-4xl max-h-[90vh] rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {item.outputUrl ? (
          <img src={item.outputUrl} alt={item.title} className="max-w-full max-h-[85vh] object-contain" />
        ) : item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="max-w-full max-h-[85vh] object-contain" />
        ) : null}
        <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="text-sm font-medium text-white">{item.title}</div>
          {item.error && <div className="text-xs text-red-300 mt-1">{item.error}</div>}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function BatchProgressGrid({ items, stats, onStop, onPause, onRetry, isRunning }: BatchProgressGridProps) {
  const [expandedItem, setExpandedItem] = useState<BatchItem | null>(null)
  const [page, setPage] = useState(1)
  const itemsPerPage = 30
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const overallProgress = stats
    ? stats.total > 0 ? Math.round(((stats.completed + stats.failed) / stats.total) * 100) : 0
    : 0

  if (items.length === 0 && !isRunning) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-12 w-12 text-muted-foreground/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="text-sm text-muted-foreground">No batch running</div>
        <div className="text-xs text-muted-foreground/60 mt-1">Configure and start a generation to see progress here</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {stats && isRunning && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {stats.completed} / {stats.total} complete
              {stats.failed > 0 && <span className="text-red-400 ml-1">({stats.failed} failed)</span>}
            </span>
            <span className="font-medium tabular-nums">{overallProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex gap-2">
            {onPause && (
              <button
                type="button"
                onClick={onPause}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </button>
            )}
            {onStop && (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6V6z" />
                </svg>
                Stop
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        <AnimatePresence mode="popLayout">
          {items.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onRetry={onRetry}
              onClick={() => {
                if (item.thumbnailUrl || item.outputUrl) setExpandedItem(item)
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {items.length > itemsPerPage && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, items.length)} of {items.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-50"
            >
              Prev
            </button>
            <span className="tabular-nums">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {expandedItem && (
          <ImageModal item={expandedItem} onClose={() => setExpandedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
