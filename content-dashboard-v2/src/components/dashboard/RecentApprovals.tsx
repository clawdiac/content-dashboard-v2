'use client'

import { useMemo } from 'react'
import { useApprovalStore } from '@/store/approval'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export function RecentApprovals() {
  const router = useRouter()
  const items = useApprovalStore((s) => s.items)

  const recentApproved = useMemo(() => {
    return items
      .filter((i) => i.approvalStatus === 'approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
  }, [items])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        {recentApproved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approved images yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {recentApproved.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer overflow-hidden rounded-lg border transition-all hover:ring-2 hover:ring-primary"
                onClick={() => router.push('/approval')}
              >
                <div className="aspect-square bg-muted">
                  {item.outputUrl ? (
                    <img
                      src={item.thumbnailUrl || item.outputUrl}
                      alt={item.batchId}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                      No preview
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="truncate text-xs text-muted-foreground">
                    {item.batchId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
