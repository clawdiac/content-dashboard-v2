'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type BatchWorkflowStatus =
  | 'idle'
  | 'setup'
  | 'previewing'
  | 'confirming'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type BatchWorkflowType = 'seed_lock' | 'prompt_lock'
export type BatchWorkflowProvider = 'kling' | 'seedance' | 'veo'

export interface BatchWorkflowCharacter {
  id: string
  name: string
  description?: string | null
}

export interface BatchWorkflowPreview {
  id: string
  workflowId: string
  seed?: number | null
  prompt: string
  videoUrl?: string | null
  thumbnailUrl?: string | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  selected?: boolean
  error?: string | null
  character?: { id: string; name: string } | null
  createdAt?: string
}

export interface BatchWorkflowQueueItem {
  id: string
  workflowId: string
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled'
  position: number
  prompt?: string
  seed?: number | null
  videoUrl?: string | null
  thumbnailUrl?: string | null
  error?: string | null
  character?: { id: string; name: string } | null
}

export interface VideoPresetOption {
  id: string
  name: string
  description?: string | null
  promptTemplate: string
  duration: number
  aspectRatio: string
  resolution: string
  model: string
  characterCount?: number
}

export interface BatchWorkflow {
  id: string
  name?: string | null
  status: 'setup' | 'previewing' | 'generating' | 'completed' | 'failed' | 'cancelled'
  workflowType: BatchWorkflowType
  provider: BatchWorkflowProvider
  basePrompt: string
  aspectRatio?: string | null
  duration?: number | null
  resolution?: string | null
  totalItems?: number | null
  completedItems?: number | null
  failedItems?: number | null
  lockedSeed?: number | null
  lockedPrompt?: string | null
  videoPresetId?: string | null
  videoPreset?: { id: string; name: string } | null
  previewCharacter?: { id: string; name: string } | null
  params?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
  previews?: BatchWorkflowPreview[]
  queueItems?: BatchWorkflowQueueItem[]
  queuedCharacters?: { id: string; name: string }[]
}

interface CreateWorkflowInput {
  presetId: string
  provider: BatchWorkflowProvider
}

interface ConfirmWorkflowInput {
  approvedPreviewId?: string
  confirmedPrompt?: string
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data as T
}

function toStatus(status?: string | null): BatchWorkflowStatus {
  if (status === 'setup') return 'setup'
  if (status === 'previewing') return 'previewing'
  if (status === 'generating') return 'generating'
  if (status === 'completed') return 'completed'
  if (status === 'failed') return 'failed'
  if (status === 'cancelled') return 'cancelled'
  return 'idle'
}

export function useBatchWorkflow(initialWorkflowId?: string) {
  const [workflowId, setWorkflowId] = useState<string | null>(initialWorkflowId ?? null)
  const [workflow, setWorkflow] = useState<BatchWorkflow | null>(null)
  const [previews, setPreviews] = useState<BatchWorkflowPreview[]>([])
  const [queueItems, setQueueItems] = useState<BatchWorkflowQueueItem[]>([])
  const [status, setStatus] = useState<BatchWorkflowStatus>(initialWorkflowId ? 'setup' : 'idle')
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const fetchWorkflow = useCallback(
    async (id?: string, options?: { silent?: boolean }) => {
      const targetId = id || workflowId
      if (!targetId) return null

      if (!options?.silent) setIsLoading(true)
      setError(null)

      try {
        const data = await fetchJson<BatchWorkflow>(`/api/batch-workflow/${targetId}`)
        setWorkflow(data)
        setPreviews(data.previews ?? [])
        setQueueItems(data.queueItems ?? [])
        setStatus(toStatus(data.status))
        setWorkflowId(targetId)
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workflow')
        return null
      } finally {
        if (!options?.silent) setIsLoading(false)
      }
    },
    [workflowId]
  )

  const createWorkflow = useCallback(async (input: CreateWorkflowInput) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchJson<BatchWorkflow>('/api/batch-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      setWorkflow(data)
      setWorkflowId(data.id)
      setPreviews([])
      setQueueItems(data.queueItems ?? [])
      setStatus('setup')
      setSelectedPreviewId(null)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generatePreviews = useCallback(async (id?: string) => {
    const targetId = id || workflowId
    if (!targetId) return null

    setIsLoading(true)
    setError(null)
    setStatus('previewing')

    try {
      const data = await fetchJson<{ previews: BatchWorkflowPreview[]; previewCharacter: { id: string; name: string } }>(
        `/api/batch-workflow/${targetId}/preview`,
        { method: 'POST' }
      )
      setPreviews(data.previews)
      setWorkflow((prev) => prev ? { ...prev, status: 'previewing', previewCharacter: data.previewCharacter } : prev)
      return data.previews
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate previews')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [workflowId])

  const selectPreview = useCallback((previewId: string | null) => {
    setSelectedPreviewId(previewId)
  }, [])

  const confirmWorkflow = useCallback(
    async (input: ConfirmWorkflowInput) => {
      if (!workflowId) return null

      setIsLoading(true)
      setError(null)

      try {
        const data = await fetchJson<BatchWorkflow>(`/api/batch-workflow/${workflowId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        setWorkflow(data)
        setQueueItems(data.queueItems ?? [])
        setStatus(toStatus(data.status))
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to confirm workflow')
        setStatus('failed')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [workflowId]
  )

  const pollStatus = useCallback(
    async (id?: string) => {
      const targetId = id || workflowId
      if (!targetId) return null

      try {
        const data = await fetchJson<{
          id: string
          status: BatchWorkflow['status']
          totalItems: number
          completedItems: number
          failedItems: number
          queueItems: Array<{
            id: string
            status: BatchWorkflowQueueItem['status']
            position: number
            character?: { id: string; name: string } | null
          }>
        }>(`/api/batch-workflow/${targetId}/status`)

        setWorkflow((prev) =>
          prev
            ? { ...prev, status: data.status, totalItems: data.totalItems, completedItems: data.completedItems, failedItems: data.failedItems }
            : prev
        )
        setStatus(toStatus(data.status))

        let shouldRefresh = false
        setQueueItems((prev) => {
          const prevMap = new Map(prev.map((item) => [item.id, item]))
          return data.queueItems.map((item) => {
            const existing = prevMap.get(item.id)
            if (item.status === 'completed' && !existing?.videoUrl) shouldRefresh = true
            return { ...existing, id: item.id, status: item.status, position: item.position, character: item.character ?? existing?.character ?? null } as BatchWorkflowQueueItem
          })
        })

        if (shouldRefresh) await fetchWorkflow(targetId, { silent: true })
        return data
      } catch {
        return null
      }
    },
    [workflowId, fetchWorkflow]
  )

  const cancelWorkflow = useCallback(async (id?: string) => {
    const targetId = id || workflowId
    if (!targetId) return null

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchJson<BatchWorkflow>(`/api/batch-workflow/${targetId}/cancel`, { method: 'POST' })
      setWorkflow(data)
      setQueueItems(data.queueItems ?? [])
      setStatus(toStatus(data.status))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel workflow')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [workflowId])

  useEffect(() => {
    if (initialWorkflowId && initialWorkflowId !== workflowId) {
      setWorkflowId(initialWorkflowId)
      fetchWorkflow(initialWorkflowId, { silent: true })
    }
  }, [initialWorkflowId, workflowId, fetchWorkflow])

  useEffect(() => {
    clearPolling()
    if (status !== 'generating' || !workflowId) return
    pollStatus(workflowId)
    pollingRef.current = setInterval(() => pollStatus(workflowId), 3000)
    return () => clearPolling()
  }, [status, workflowId, pollStatus, clearPolling])

  return {
    workflow,
    previews,
    queueItems,
    status,
    error,
    isLoading,
    selectedPreviewId,
    createWorkflow,
    fetchWorkflow,
    generatePreviews,
    selectPreview,
    confirmWorkflow,
    pollStatus,
    cancelWorkflow,
    setWorkflowId,
  }
}
