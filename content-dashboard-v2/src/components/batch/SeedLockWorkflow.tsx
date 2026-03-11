'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useBatchWorkflow, type BatchWorkflow, type BatchWorkflowPreview } from '@/hooks/useBatchWorkflow'
import { getVideoSrc } from '@/lib/video-url'

interface SeedLockWorkflowProps {
  workflowId: string
  onConfirmed?: (workflow: BatchWorkflow) => void
}

const statusStyles: Record<BatchWorkflowPreview['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  generating: { label: 'Generating', className: 'bg-yellow-500/10 text-yellow-500' },
  completed: { label: 'Ready', className: 'bg-emerald-500/10 text-emerald-500' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-500' },
}

export function SeedLockWorkflow({ workflowId, onConfirmed }: SeedLockWorkflowProps) {
  const {
    workflow,
    previews,
    status,
    error,
    isLoading,
    generatePreviews,
    confirmWorkflow,
  } = useBatchWorkflow(workflowId)

  const previewCharacter = workflow?.previewCharacter
  const totalCharacters = workflow?.totalItems ?? 0

  const handleApprove = async (previewId: string) => {
    const result = await confirmWorkflow({ approvedPreviewId: previewId })
    if (result) {
      onConfirmed?.(result)
    }
  }

  const allPreviewsReady = previews.length > 0 && previews.every((p) => p.status === 'completed' || p.status === 'failed')
  const hasCompletedPreviews = previews.some((p) => p.status === 'completed')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Seed-Lock Preview</CardTitle>
            {previewCharacter && (
              <p className="text-sm text-muted-foreground mt-1">
                Testing with: <span className="font-medium text-foreground">{previewCharacter.name}</span>
                {' '}(first of {totalCharacters} characters)
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] uppercase',
              status === 'previewing' ? 'text-yellow-500' : 'text-muted-foreground'
            )}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {previews.length === 0 && (
          <>
            <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Generate 4 test videos with random seeds for <strong>{previewCharacter?.name ?? 'first character'}</strong>.
                Pick the best one to lock the seed for all {totalCharacters} characters.
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              onClick={() => generatePreviews(workflowId)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating 4 Previews...' : 'Generate 4 Test Videos'}
            </Button>
          </>
        )}

        {/* 2×2 Preview Grid */}
        {previews.length > 0 && (
          <div className="grid gap-3 grid-cols-2">
            {previews.map((preview) => {
              const style = statusStyles[preview.status]
              return (
                <motion.div
                  key={preview.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="overflow-hidden rounded-lg border"
                >
                  <div className="relative bg-muted/40 flex items-center justify-center" style={{ minHeight: '200px' }}>
                    {preview.videoUrl && preview.status === 'completed' ? (
                      <video
                        src={getVideoSrc(preview.videoUrl)}
                        className="max-h-[400px] w-auto rounded"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        {preview.status === 'generating' ? (
                          <span className="animate-pulse">Generating...</span>
                        ) : preview.status === 'failed' ? (
                          <span className="text-red-500">Failed</span>
                        ) : (
                          'Pending'
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-mono font-medium">
                        Seed {preview.seed ?? '—'}
                      </div>
                      <Badge variant="outline" className={cn('text-[10px] uppercase', style.className)}>
                        {style.label}
                      </Badge>
                    </div>
                    {preview.status === 'completed' && (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => handleApprove(preview.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Locking...' : '✓ Approve This Seed'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Regenerate button */}
        {allPreviewsReady && (
          <Button
            type="button"
            variant="outline"
            onClick={() => generatePreviews(workflowId)}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Regenerating...' : 'Regenerate All 4 Previews'}
          </Button>
        )}

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
