'use client'

import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { BatchStats } from '@/types'

export type VideoItemStatus = 'pending' | 'queued' | 'generating' | 'completed' | 'failed'

export interface VideoItem {
  id: string
  title: string
  status: VideoItemStatus
  progress: number
  thumbnailUrl?: string
  videoUrl?: string
  error?: string
  model?: string
  duration?: number
}

interface VideoProgressGridProps {
  items: VideoItem[]
  stats: BatchStats | null
  onStop?: () => void
  onPause?: () => void
  onRetry?: (itemId: string) => void
  isRunning: boolean
}

const statusConfig: Record<VideoItemStatus, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-muted-foreground', bg: 'bg-muted/40', label: 'Pending' },
  queued: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Queued' },
  generating: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Generating' },
  completed: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Done' },
  failed: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Failed' },
}

const VideoCard = memo(function VideoCard({
  item,
  onClick,
  onRetry,
}: {
  item: VideoItem
  onClick: () => void
  onRetry?: (id: string) => void
}) {
  const config = statusConfig[item.status]

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
        'relative aspect-video rounded-lg border overflow-hidden transition-all group',
        item.status === 'completed'
          ? 'border-border hover:border-primary/50'
          : 'border-border'
      )}
    >
      {/* Thumbnail or placeholder */}
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
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
              {item.error && (
                <span className="text-[9px] text-red-400/80 max-w-[80%] truncate">{item.error}</span>
              )}
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
            <svg className="h-6 w-6 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      )}

      {/* Progress bar */}
      {item.status === 'generating' && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-muted">
          <motion.div className="h-full bg-blue-500" animate={{ width: `${item.progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-1 left-1">
        <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium backdrop-blur-sm', config.color, config.bg)}>
          {config.label}
        </span>
      </div>

      {/* Model badge */}
      {item.model && (
        <div className="absolute top-1 right-1">
          <span className="inline-flex items-center rounded-full bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-white/80 capitalize">
            {item.model}
          </span>
        </div>
      )}

      {/* Play icon for completed videos */}
      {item.status === 'completed' && (
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="h-5 w-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
        <div className="text-[10px] text-white font-medium truncate">{item.title}</div>
        {item.duration && <div className="text-[9px] text-white/60">{item.duration}s</div>}
      </div>
    </motion.button>
  )
}, (prev, next) =>
  prev.item.status === next.item.status &&
  prev.item.progress === next.item.progress &&
  prev.item.thumbnailUrl === next.item.thumbnailUrl &&
  prev.item.videoUrl === next.item.videoUrl
)

function VideoPreviewModal({ item, onClose }: { item: VideoItem; onClose: () => void }) {
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
        className="relative max-w-4xl w-full max-h-[90vh] rounded-lg overflow-hidden bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            controls
            autoPlay
            className="w-full max-h-[85vh] object-contain"
          />
        ) : item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="w-full max-h-[85vh] object-contain" />
        ) : item.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <svg className="h-12 w-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm font-medium text-red-400">Generation Failed</div>
            {item.error && <div className="text-xs text-red-300/80 mt-2 max-w-md">{item.error}</div>}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="text-sm font-medium text-white">{item.title}</div>
          {item.model && <div className="text-xs text-white/60 mt-0.5 capitalize">{item.model} • {item.duration}s</div>}
          {item.error && <div className="text-xs text-red-300 mt-1">{item.error}</div>}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function VideoProgressGrid({ items, stats, onStop, onPause, onRetry, isRunning }: VideoProgressGridProps) {
  const [previewItem, setPreviewItem] = useState<VideoItem | null>(null)

  const overallProgress = stats
    ? stats.total > 0 ? Math.round(((stats.completed + stats.failed) / stats.total) * 100) : 0
    : 0

  if (items.length === 0 && !isRunning) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-12 w-12 text-muted-foreground/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <div className="text-sm text-muted-foreground">No video batch running</div>
        <div className="text-xs text-muted-foreground/60 mt-1">Configure and start a video generation to see progress here</div>
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
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.5 }} />
          </div>

          <div className="flex gap-2">
            {onPause && (
              <button
                type="button"
                onClick={onPause}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                Pause
              </button>
            )}
            {onStop && (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6V6z" /></svg>
                Stop
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <VideoCard
              key={item.id}
              item={item}
              onRetry={onRetry}
              onClick={() => {
                if (item.videoUrl || item.thumbnailUrl || item.status === 'failed') setPreviewItem(item)
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {previewItem && (
          <VideoPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
