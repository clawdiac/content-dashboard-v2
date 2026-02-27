'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useBatchWorkflow } from '@/hooks/useBatchWorkflow'

interface BatchProgressProps {
  workflowId: string
}

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Queued', className: 'bg-muted text-muted-foreground' },
  generating: { label: 'Generating', className: 'bg-yellow-500/10 text-yellow-500 animate-pulse' },
  completed: { label: 'Done', className: 'bg-emerald-500/10 text-emerald-500' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-500' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
}

export function BatchProgress({ workflowId }: BatchProgressProps) {
  const { workflow, queueItems, status, error, isLoading, cancelWorkflow } = useBatchWorkflow(workflowId)

  const total = workflow?.totalItems ?? 0
  const completed = workflow?.completedItems ?? 0
  const failed = workflow?.failedItems ?? 0
  const pending = total - completed - failed
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isFinished = status === 'completed' || status === 'failed' || status === 'cancelled'

  // Find currently generating item
  const currentItem = queueItems.find((item) => item.status === 'generating')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{workflow?.name || 'Batch Progress'}</CardTitle>
            {workflow?.lockedSeed && (
              <p className="text-xs text-muted-foreground mt-1">
                Locked seed: <span className="font-mono font-medium">{workflow.lockedSeed}</span>
              </p>
            )}
            {workflow?.lockedPrompt && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                Locked prompt: {workflow.lockedPrompt}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] uppercase',
              status === 'completed' ? 'text-emerald-500' :
              status === 'failed' ? 'text-red-500' :
              status === 'generating' ? 'text-yellow-500' :
              'text-muted-foreground'
            )}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Progress bar */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{completed} / {total} generated</span>
            <span className="text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          {currentItem && (
            <p className="text-xs text-muted-foreground">
              Currently generating: <span className="font-medium text-foreground">{currentItem.character?.name ?? `Character ${currentItem.position + 1}`}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Completed: {completed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>Failed: {failed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            <span>Pending: {pending}</span>
          </div>
        </div>

        {/* Character grid */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {queueItems.map((item) => {
            const style = statusStyles[item.status] ?? statusStyles.pending
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'overflow-hidden rounded-lg border transition-all',
                  item.status === 'generating' && 'border-yellow-500/50 ring-1 ring-yellow-500/20'
                )}
              >
                <div className="relative aspect-video bg-muted/40">
                  {item.videoUrl && item.status === 'completed' ? (
                    <video
                      src={item.videoUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      loop
                      autoPlay
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      {item.status === 'generating' ? (
                        <span className="animate-pulse">Generating...</span>
                      ) : item.status === 'failed' ? (
                        <span className="text-red-500">Failed</span>
                      ) : (
                        'Queued'
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-2">
                  <div className="text-xs font-medium truncate">
                    {item.character?.name ?? `Character ${item.position + 1}`}
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] uppercase shrink-0', style.className)}>
                    {style.label}
                  </Badge>
                </div>
                {item.error && (
                  <div className="px-2 pb-2 text-[10px] text-red-500 truncate">{item.error}</div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Completion */}
        {isFinished && status === 'completed' && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-center text-sm text-emerald-500">
            🎉 All done! {completed} videos generated successfully.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {error}
          </div>
        )}

        {!isFinished && (
          <Button
            type="button"
            variant="outline"
            onClick={() => cancelWorkflow(workflowId)}
            disabled={isLoading}
          >
            Cancel Batch
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
