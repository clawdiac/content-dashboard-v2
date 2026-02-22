'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CampaignBatch {
  id: string
  campaignName: string | null
  templatePresetId: string | null
  totalItems: number
  completed: number
  failed: number
  status: string
  createdAt: string
  rerunnable: boolean
}

const statusStyles: Record<string, string> = {
  pending: 'text-muted-foreground',
  processing: 'text-blue-500',
  completed: 'text-emerald-500',
  completed_with_errors: 'text-amber-500',
  failed: 'text-red-500',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({})

  const fetchCampaigns = useCallback(async (pageToLoad: number, replace = false) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/batch?page=${pageToLoad}&limit=50`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed: ${res.status}`)
      }
      const data = await res.json()
      const batches = (data.batches || []) as CampaignBatch[]
      const filtered = batches.filter((b) => b.campaignName)

      setCampaigns((prev) => (replace ? filtered : [...prev, ...filtered]))
      setHasMore(pageToLoad < (data.pages || 1))
      setPage(pageToLoad)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns(1, true)
  }, [fetchCampaigns])

  const handleRerun = useCallback(async (batchId: string) => {
    try {
      setActionBusy((s) => ({ ...s, [batchId]: true }))
      const res = await fetch('/api/batch/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceBatchId: batchId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Re-run failed: ${res.status}`)
      }
      await fetchCampaigns(1, true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to re-run campaign')
    } finally {
      setActionBusy((s) => ({ ...s, [batchId]: false }))
    }
  }, [fetchCampaigns])

  const handleDelete = useCallback(async (batchId: string) => {
    if (!window.confirm('Delete this campaign batch? This cannot be undone.')) return

    try {
      setActionBusy((s) => ({ ...s, [batchId]: true }))
      const res = await fetch(`/api/batch/${batchId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Delete failed: ${res.status}`)
      }
      setCampaigns((prev) => prev.filter((b) => b.id !== batchId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete campaign')
    } finally {
      setActionBusy((s) => ({ ...s, [batchId]: false }))
    }
  }, [])

  const list = useMemo(() => campaigns, [campaigns])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Batch history for rerunnable campaigns</p>
        </div>
        <Badge variant="outline">{list.length}</Badge>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Campaign History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && list.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-sm text-muted-foreground">No campaign batches yet</div>
          ) : (
            <div className="space-y-2">
              {list.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {batch.campaignName || 'Untitled Campaign'}
                      </span>
                      <Badge variant="outline" className={cn('text-[10px]', statusStyles[batch.status] || 'text-muted-foreground')}>
                        {batch.status.replaceAll('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Preset: <span className="font-mono">{batch.templatePresetId || '—'}</span>
                      </span>
                      <span>•</span>
                      <span>Characters: {batch.totalItems}</span>
                      <span>•</span>
                      <span>Created: {new Date(batch.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRerun(batch.id)}
                      disabled={actionBusy[batch.id]}
                    >
                      Re-run
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(batch.id)}
                      disabled={actionBusy[batch.id]}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCampaigns(page + 1)}
                disabled={loading}
              >
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
