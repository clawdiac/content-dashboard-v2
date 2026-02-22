'use client'

import { useMemo } from 'react'
import { useApprovalStore } from '@/store/approval'
import { useQueueStore } from '@/store/queue'
import { Card, CardContent } from '@/components/ui/card'
import {
  Image as ImageIcon,
  CheckCircle,
  Film,
  Clock,
  Timer,
  AlertTriangle,
} from 'lucide-react'

export function DashboardStats() {
  const approvalItems = useApprovalStore((s) => s.items)
  const running = useQueueStore((s) => s.running)
  const queued = useQueueStore((s) => s.queued)
  const completed = useQueueStore((s) => s.completed)

  const stats = useMemo(() => {
    const pending = approvalItems.filter((i) => i.approvalStatus === 'pending').length
    const approved = approvalItems.filter((i) => i.approvalStatus === 'approved').length
    const videos = running.filter((j) => j.type === 'video').length + queued.filter((j) => j.type === 'video').length
    const completedVideos = completed.filter((j) => j.type === 'video').length
    const totalEta = running.reduce((acc, j) => acc + (j.estimatedTimeRemaining ?? 0), 0)
    // TODO: Use status === 'failed' once QueueJob supports it
    const errorRate = null

    return [
      { label: 'Pending Images', value: pending, icon: ImageIcon, color: 'text-amber-500' },
      { label: 'Approved Images', value: approved, icon: CheckCircle, color: 'text-emerald-500' },
      { label: 'Processing Videos', value: videos, icon: Film, color: 'text-blue-500' },
      { label: 'Completed Videos', value: completedVideos, icon: Film, color: 'text-purple-500' },
      { label: 'Est. Time', value: totalEta > 0 ? `${Math.round(totalEta / 60)}m` : '—', icon: Timer, color: 'text-cyan-500' },
      { label: 'Error Rate', value: '—', icon: AlertTriangle, color: 'text-muted-foreground' },
    ]
  }, [approvalItems, running, queued, completed])

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
