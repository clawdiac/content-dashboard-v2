'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useBatchWorkflow, type BatchWorkflow, type BatchWorkflowPreview } from '@/hooks/useBatchWorkflow'

interface SeedLockWorkflowProps {
  workflowId: string
  onConfirmed?: (workflow: BatchWorkflow) => void
}

const statusStyles: Record<BatchWorkflowPreview['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  generating: { label: 'Generating', className: 'bg-yellow-500/10 text-yellow-500' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-500' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-500' },
}

export function SeedLockWorkflow({ workflowId, onConfirmed }: SeedLockWorkflowProps) {
  const {
    previews,
    selectedPreviewId,
    status,
    error,
    isLoading,
    generatePreviews,
    selectPreview,
    confirmWorkflow,
  } = useBatchWorkflow(workflowId)

  const readyToConfirm = useMemo(() => !!selectedPreviewId, [selectedPreviewId])

  const handleConfirm = async () => {
    if (!selectedPreviewId) return
    const workflow = await confirmWorkflow({
      workflowId,
      selectedPreviewId,
    })
    if (workflow) {
      onConfirmed?.(workflow)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Seed-Lock Preview Selection</CardTitle>
          <Badge variant="outline" className={cn('text-[10px] uppercase', status === 'previewing' ? 'text-yellow-500' : 'text-muted-foreground')}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            onClick={() => generatePreviews(workflowId)}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate 4 Previews'}
          </Button>
          <div className="text-xs text-muted-foreground">Pick the best seed to lock for the full batch.</div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {previews.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No previews yet. Generate previews to continue.
            </div>
          )}

          {previews.map((preview) => {
            const style = statusStyles[preview.status]
            const isSelected = selectedPreviewId === preview.id
            return (
              <motion.button
                key={preview.id}
                type="button"
                onClick={() => selectPreview(preview.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative overflow-hidden rounded-lg border text-left transition-all',
                  isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                )}
              >
                <div className="relative aspect-video bg-muted/40">
                  {preview.videoUrl && preview.status === 'completed' ? (
                    <video
                      src={preview.videoUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      loop
                      autoPlay
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      {preview.status === 'generating' ? 'Generating preview...' : 'Preview pending'}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">Seed {preview.seed ?? '--'}</div>
                    <div className="text-xs text-muted-foreground">Preview #{preview.id.slice(0, 6)}</div>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] uppercase', style.className)}>
                    {style.label}
                  </Badge>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-1">Selected</div>
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {error}
          </div>
        )}

        <Button
          type="button"
          variant="default"
          onClick={handleConfirm}
          disabled={!readyToConfirm || isLoading}
        >
          {isLoading ? 'Starting...' : 'Confirm Seed & Start Batch'}
        </Button>
      </CardContent>
    </Card>
  )
}
