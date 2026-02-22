'use client'

import { useBatchStore } from '@/store/batch'
import { useQueueStore } from '@/store/queue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export function ActiveJobs() {
  const router = useRouter()
  const batches = useBatchStore((s) => s.batches)
  const running = useQueueStore((s) => s.running)

  const activeBatches = Object.values(batches).filter((b) => b.status === 'running')
  // Deduplicate: exclude running jobs whose batchId matches an active batch
  const activeBatchIds = new Set(activeBatches.map((b) => b.id))
  const dedupedRunning = running.filter((j) => !activeBatchIds.has(j.batchId))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Jobs</CardTitle>
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push('/queue')}
          >
            View Queue →
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activeBatches.length === 0 && dedupedRunning.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active jobs</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {activeBatches.map((batch) => {
              const pct = Math.round((batch.stats.completed / Math.max(batch.stats.total, 1)) * 100)
              return (
                <div
                  key={batch.id}
                  className="min-w-[200px] cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  onClick={() => router.push('/queue')}
                >
                  <div className="text-sm font-medium truncate">{batch.id}</div>
                  <div className="mt-2">
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{batch.stats.completed}/{batch.stats.total}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              )
            })}
            {dedupedRunning.map((job) => (
              <div
                key={job.id}
                className="min-w-[200px] cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50"
                onClick={() => router.push('/queue')}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{job.batchId}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{job.type}</Badge>
                </div>
                <div className="mt-2">
                  <Progress value={job.progress} className="h-2" />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{job.completedJobs}/{job.totalJobs}</span>
                  {job.estimatedTimeRemaining != null && <span>~{job.estimatedTimeRemaining}s</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
