'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useBatchWorkflow, type BatchWorkflowQueueItem } from '@/hooks/useBatchWorkflow'

interface BatchProgressProps {
  workflowId: string
}

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  generating: { label: 'Generating', className: 'bg-yellow-500/10 text-yellow-500' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-500' },
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {workflow?.name || 'Batch Progress'}
          </CardTitle>
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
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span>{completed} / {total} completed</span>
            <span className="text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

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

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {queueItems.map((item) => {
            const style = statusStyles[item.status] ?? statusStyles.pending
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-lg border"
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
                      {item.status === 'generating' ? 'Generating...' :
                       item.status === 'failed' ? 'Failed' : 'Pending'}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-2">
                  <div className="text-xs font-medium truncate">
                    {item.character?.name ?? `Item ${item.position + 1}`}
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] uppercase', style.className)}>
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

        {isFinished && status === 'completed' && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-500">
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
