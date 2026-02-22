import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { batchApi } from '@/lib/api'
import type { Batch, BatchConfig, BatchStats, SSEJobProgress, SSEJobCompleted, SSEJobFailed, SSEBatchCompleted, SSEBatchCreated } from '@/types'

interface BatchState {
  batches: Record<string, Batch>
  activeBatchId: string | null
  error: string | null

  createBatch: (config: BatchConfig) => Promise<string>
  pauseBatch: (id: string) => void
  cancelBatch: (id: string) => void
  setActiveBatch: (id: string | null) => void
  clearError: () => void

  onBatchCreated: (event: SSEBatchCreated) => void
  onJobProgress: (event: SSEJobProgress) => void
  onJobComplete: (event: SSEJobCompleted) => void
  onJobFailed: (event: SSEJobFailed) => void
  onBatchCompleted: (event: SSEBatchCompleted) => void
}

export const useBatchStore = create<BatchState>()(
  devtools(
    (set) => ({
      batches: {},
      activeBatchId: null,
      error: null,

      createBatch: async (config: BatchConfig) => {
        try {
          const data = await batchApi.create(config)
          set({ error: null })
          return data.batchId
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to create batch'
          set({ error: msg })
          throw e
        }
      },

      pauseBatch: (id: string) => {
        set((state) => {
          const batch = state.batches[id]
          if (!batch) return state
          return { batches: { ...state.batches, [id]: { ...batch, status: 'paused' } } }
        })
      },

      cancelBatch: (id: string) => {
        set((state) => {
          const batch = state.batches[id]
          if (!batch) return state
          return { batches: { ...state.batches, [id]: { ...batch, status: 'cancelled' } } }
        })
      },

      setActiveBatch: (id: string | null) => set({ activeBatchId: id }),
      clearError: () => set({ error: null }),

      onBatchCreated: (event: SSEBatchCreated) => {
        set((state) => ({
          batches: {
            ...state.batches,
            [event.batchId]: {
              id: event.batchId,
              type: 'image',
              status: 'running',
              jobs: [],
              createdAt: new Date().toISOString(),
              stats: { total: event.totalJobs, completed: 0, failed: 0, inProgress: 0 },
            },
          },
          activeBatchId: event.batchId,
        }))
      },

      onJobProgress: (event: SSEJobProgress) => {
        set((state) => {
          const batch = state.batches[event.batchId]
          if (!batch) return state
          const jobs = batch.jobs.map((j) =>
            j.id === event.jobId ? { ...j, progress: event.progress, status: 'running' as const } : j
          )
          return { batches: { ...state.batches, [event.batchId]: { ...batch, jobs } } }
        })
      },

      onJobComplete: (event: SSEJobCompleted) => {
        set((state) => {
          const batch = state.batches[event.batchId]
          if (!batch) return state
          const jobs = batch.jobs.map((j) =>
            j.id === event.jobId
              ? { ...j, status: 'completed' as const, progress: 100, outputUrl: event.outputUrl, thumbnailUrl: event.thumbnailUrl }
              : j
          )
          const stats: BatchStats = {
            ...batch.stats,
            completed: batch.stats.completed + 1,
            inProgress: Math.max(0, batch.stats.inProgress - 1),
          }
          return { batches: { ...state.batches, [event.batchId]: { ...batch, jobs, stats } } }
        })
      },

      onJobFailed: (event: SSEJobFailed) => {
        set((state) => {
          const batch = state.batches[event.batchId]
          if (!batch) return state
          const jobs = batch.jobs.map((j) =>
            j.id === event.jobId ? { ...j, status: 'failed' as const, error: event.error } : j
          )
          const stats: BatchStats = {
            ...batch.stats,
            failed: batch.stats.failed + 1,
            inProgress: Math.max(0, batch.stats.inProgress - 1),
          }
          return { batches: { ...state.batches, [event.batchId]: { ...batch, jobs, stats } } }
        })
      },

      onBatchCompleted: (event: SSEBatchCompleted) => {
        set((state) => {
          const batch = state.batches[event.batchId]
          if (!batch) return state
          return {
            batches: {
              ...state.batches,
              [event.batchId]: {
                ...batch,
                status: 'completed',
                completedAt: new Date().toISOString(),
                stats: event.stats,
              },
            },
          }
        })
      },
    }),
    { name: 'batch-store' }
  )
)
