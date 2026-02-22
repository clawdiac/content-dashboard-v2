'use client'

import { useEffect } from 'react'
import { useQueueStore } from '@/store/queue'
import { useApprovalStore } from '@/store/approval'
import { useConfigStore } from '@/store/config'
import { useSSE } from '@/context/SSEContext'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, X } from 'lucide-react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { ActiveJobs } from '@/components/dashboard/ActiveJobs'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentApprovals } from '@/components/dashboard/RecentApprovals'

function ErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="shrink-0 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const { connected } = useSSE()
  const queueError = useQueueStore((s) => s.error)
  const clearQueueError = useQueueStore((s) => s.clearError)
  const approvalError = useApprovalStore((s) => s.error)
  const clearApprovalError = useApprovalStore((s) => s.clearError)
  const configError = useConfigStore((s) => s.error)
  const clearConfigError = useConfigStore((s) => s.clearError)
  const fetchQueue = useQueueStore((s) => s.fetchQueue)
  const fetchItems = useApprovalStore((s) => s.fetchItems)
  const fetchCharacters = useConfigStore((s) => s.fetchCharacters)
  const fetchPresets = useConfigStore((s) => s.fetchPresets)

  useEffect(() => {
    fetchQueue()
    fetchItems()
    fetchCharacters()
    fetchPresets()
  }, [fetchQueue, fetchItems, fetchCharacters, fetchPresets])

  const errors = [
    queueError && { msg: `Queue: ${queueError}`, clear: clearQueueError },
    approvalError && { msg: `Approval: ${approvalError}`, clear: clearApprovalError },
    configError && { msg: `Config: ${configError}`, clear: clearConfigError },
  ].filter(Boolean) as { msg: string; clear: () => void }[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Command center overview</p>
        </div>
        <Badge variant={connected ? 'success' : 'warning'}>
          {connected ? '● Live' : '○ Connecting'}
        </Badge>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((e, i) => (
            <ErrorAlert key={i} message={e.msg} onDismiss={e.clear} />
          ))}
        </div>
      )}

      <DashboardStats />
      <ActiveJobs />
      <QuickActions />
      <RecentApprovals />
    </div>
  )
}
