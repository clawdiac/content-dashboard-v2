'use client'

import type { QueueJob } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface QueueSectionProps {
  title: string
  items: QueueJob[]
  variant: 'running' | 'queued' | 'completed'
}

const variantColors = {
  running: 'text-blue-500',
  queued: 'text-amber-500',
  completed: 'text-emerald-500',
}

export function QueueSection({ title, items, variant }: QueueSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline" className={variantColors[variant]}>
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {variant} jobs</p>
        ) : (
          <div className="space-y-3">
            {items.map((job, index) => (
              <div
                key={job.id}
                className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{job.batchId}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {job.type}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {job.completedJobs}/{job.totalJobs} items
                    {job.estimatedTimeRemaining != null && variant === 'running' && (
                      <> · ~{job.estimatedTimeRemaining}s remaining</>
                    )}
                  </div>
                </div>
                {variant === 'running' && (
                  <div className="w-24">
                    <Progress value={job.progress} className="h-2" />
                  </div>
                )}
                <span className="text-xs font-medium tabular-nums">
                  {variant === 'running'
                    ? `${Math.round(job.progress)}%`
                    : variant === 'completed'
                      ? '✓'
                      : `#${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
