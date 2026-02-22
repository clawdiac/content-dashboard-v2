'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { SSEClient } from '@/lib/sse'
import { useBatchStore } from '@/store/batch'
import { useApprovalStore } from '@/store/approval'
import { useQueueStore } from '@/store/queue'
import type { SSEBatchCreated, SSEJobProgress, SSEJobCompleted, SSEJobFailed, SSEBatchCompleted } from '@/types'

interface SSEContextValue {
  connected: boolean
}

const SSEContext = createContext<SSEContextValue>({ connected: false })

export function useSSE() {
  return useContext(SSEContext)
}

export function SSEProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<SSEClient | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const client = new SSEClient('/api/batch/events')
    clientRef.current = client

    // Wire SSE events to Zustand stores
    const batchStore = useBatchStore.getState()
    const approvalStore = useApprovalStore.getState()
    const queueStore = useQueueStore.getState()

    const unsubs = [
      client.on('batch:created', (data) => {
        batchStore.onBatchCreated(data as SSEBatchCreated)
      }),
      client.on('job:progress', (data) => {
        batchStore.onJobProgress(data as SSEJobProgress)
      }),
      client.on('job:completed', (data) => {
        const event = data as SSEJobCompleted
        batchStore.onJobComplete(event)
        // Auto-add to approval grid
        approvalStore.addItem({
          id: event.jobId,
          jobId: event.jobId,
          batchId: event.batchId,
          type: 'image',
          character: { id: '', name: '', displayName: '' },
          preset: { id: '', name: '', displayName: '', promptTemplate: '', width: 0, height: 0, steps: 0, cfg: 0, sampler: '', scheduler: '' },
          outputUrl: event.outputUrl,
          thumbnailUrl: event.thumbnailUrl,
          approvalStatus: 'pending',
          createdAt: new Date().toISOString(),
          eligibleForVideo: true,
        })
      }),
      client.on('job:failed', (data) => {
        batchStore.onJobFailed(data as SSEJobFailed)
      }),
      client.on('batch:completed', (data) => {
        batchStore.onBatchCompleted(data as SSEBatchCompleted)
        queueStore.onJobCompleted((data as SSEBatchCompleted).batchId)
      }),
    ]

    client.connect()

    // Poll connection status
    const interval = setInterval(() => {
      setConnected(client.connected)
    }, 2000)

    return () => {
      unsubs.forEach((unsub) => unsub())
      clearInterval(interval)
      client.disconnect()
    }
  }, [])

  return (
    <SSEContext.Provider value={{ connected }}>
      {children}
    </SSEContext.Provider>
  )
}
