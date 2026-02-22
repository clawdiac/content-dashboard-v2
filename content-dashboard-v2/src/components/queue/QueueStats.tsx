'use client'

import { useQueueStore } from '@/store/queue'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Clock, CheckCircle, Timer } from 'lucide-react'

export function QueueStats() {
  const running = useQueueStore((s) => s.running)
  const queued = useQueueStore((s) => s.queued)
  const completed = useQueueStore((s) => s.completed)

  // TODO: Avg time needs actual durationMs on QueueJob to be meaningful
  const avgTime = null

  const stats = [
    { label: 'Running', value: running.length, icon: Play, color: 'text-blue-500' },
    { label: 'Queued', value: queued.length, icon: Clock, color: 'text-amber-500' },
    { label: 'Completed Today', value: completed.length, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Avg Time', value: avgTime ? `${avgTime}s` : '—', icon: Timer, color: 'text-purple-500' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
