'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQueueStore } from '@/store/queue'
import { useSSE } from '@/context/SSEContext'
import { Badge } from '@/components/ui/badge'
import { QueueStats } from '@/components/queue/QueueStats'
import { QueueFilters, type QueueFilterState } from '@/components/queue/QueueFilters'
import { QueueSection } from '@/components/queue/QueueSection'
import type { QueueJob } from '@/types'

function filterJobs(jobs: QueueJob[], filters: QueueFilterState): QueueJob[] {
  return jobs.filter((job) => {
    if (filters.types.length > 0 && !filters.types.includes(job.type)) return false
    return true
  })
}

export default function QueuePage() {
  const { connected } = useSSE()
  const running = useQueueStore((s) => s.running)
  const queued = useQueueStore((s) => s.queued)
  const completed = useQueueStore((s) => s.completed)
  const loading = useQueueStore((s) => s.loading)
  const fetchQueue = useQueueStore((s) => s.fetchQueue)

  const [filters, setFilters] = useState<QueueFilterState>({ types: [] })

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const filteredRunning = useMemo(() => filterJobs(running, filters), [running, filters])
  const filteredQueued = useMemo(() => filterJobs(queued, filters), [queued, filters])
  const filteredCompleted = useMemo(() => filterJobs(completed, filters), [completed, filters])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Queue</h1>
          <p className="text-sm text-muted-foreground">Real-time job monitoring</p>
        </div>
        <Badge variant={connected ? 'success' : 'warning'}>
          {connected ? '● Live' : '○ Connecting'}
        </Badge>
      </div>

      <QueueStats />

      <QueueFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-6 space-y-3">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                      <div className="h-2 w-24 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-2 w-24 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <QueueSection title="Running" items={filteredRunning} variant="running" />
          <QueueSection title="Queued" items={filteredQueued} variant="queued" />
          <QueueSection title="Completed (Last 24h)" items={filteredCompleted} variant="completed" />
        </div>
      )}
    </div>
  )
}
