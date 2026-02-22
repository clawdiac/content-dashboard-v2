'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Check, X, RotateCcw, ChevronLeft, ChevronRight, Maximize2, SendHorizonal } from 'lucide-react'
import type { ApprovalItem } from '@/types'

interface ApprovalPreviewProps {
  item: ApprovalItem | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onRegenerate: (id: string) => void
  onSendToVideo: (id: string) => void
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  hasPrev: boolean
  hasNext: boolean
}

export function ApprovalPreview({
  item,
  onApprove,
  onReject,
  onRegenerate,
  onSendToVideo,
  onPrev,
  onNext,
  onClose,
  hasPrev,
  hasNext,
}: ApprovalPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false)

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, fullscreen])

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-8">
        <div className="text-center space-y-2">
          <p>Select an image to preview</p>
          <p className="text-[10px]">Use arrow keys or click a card</p>
        </div>
      </div>
    )
  }

  const statusLabel = item.approvalStatus === 'approved' ? '✅ Approved'
    : item.approvalStatus === 'rejected' ? '❌ Rejected'
    : '⏳ Pending'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.15 }}
        className="flex h-full flex-col"
      >
        {/* Image */}
        <div className="relative flex-1 min-h-0 bg-black/5 dark:bg-black/20 rounded-lg overflow-hidden">
          {item.outputUrl ? (
            <img
              src={item.outputUrl}
              alt={`${item.character.displayName}`}
              className="h-full w-full object-contain"
            />
          ) : item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={`${item.character.displayName}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image available
            </div>
          )}

          {/* Nav arrows */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev}
              className={cn(
                'ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-opacity',
                hasPrev ? 'hover:bg-black/60' : 'opacity-30 cursor-not-allowed',
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className={cn(
                'mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-opacity',
                hasNext ? 'hover:bg-black/60' : 'opacity-30 cursor-not-allowed',
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => {
              if (item.outputUrl) window.open(item.outputUrl, '_blank')
            }}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Metadata */}
        <div className="px-1 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{item.character.displayName}</h3>
              <p className="text-xs text-muted-foreground">{item.preset.displayName || item.preset.name}</p>
            </div>
            <span className="text-xs">{statusLabel}</span>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>Batch</span>
            <span className="font-mono">{item.batchId?.slice(0, 8) || '—'}</span>
            <span>Type</span>
            <span className="capitalize">{item.type}</span>
            {item.seed && <>
              <span>Seed</span>
              <span className="font-mono">{item.seed}</span>
            </>}
            <span>Created</span>
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={item.approvalStatus === 'approved' ? 'default' : 'outline'}
              onClick={() => onApprove(item.id)}
              className="gap-1.5 text-xs flex-1"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant={item.approvalStatus === 'rejected' ? 'destructive' : 'outline'}
              onClick={() => onReject(item.id)}
              className="gap-1.5 text-xs flex-1"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegenerate(item.id)}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            {item.approvalStatus === 'approved' && item.eligibleForVideo && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onSendToVideo(item.id)}
                className="gap-1.5 text-xs"
              >
                <SendHorizonal className="h-3.5 w-3.5" />
                Video
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
