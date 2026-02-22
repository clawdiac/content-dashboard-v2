import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { batchApi } from '@/lib/api'
import type { QueueJob } from '@/types'

interface QueueState {
  running: QueueJob[]
  queued: QueueJob[]
  completed: QueueJob[]
  loading: boolean
  error: string | null

  fetchQueue: () => Promise<void>
  reorder: (id: string, newPosition: number) => void
  pauseAll: () => Promise<void>
  resumeAll: () => Promise<void>
  clearError: () => void

  onQueueUpdate: (running: QueueJob[], queued: QueueJob[]) => void
  onJobCompleted: (jobId: string) => void
}

export const useQueueStore = create<QueueState>()(
  devtools(
    (set, get) => ({
      running: [],
      queued: [],
      completed: [],
      loading: false,
      error: null,

      fetchQueue: async () => {
        set({ loading: true, error: null })
        try {
          const data = await batchApi.list()
          set({
            running: data.running as QueueJob[] ?? [],
            queued: data.queued as QueueJob[] ?? [],
            completed: data.completed as QueueJob[] ?? [],
            loading: false,
          })
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch queue' })
        }
      },

      reorder: (id: string, newPosition: number) => {
        set((state) => {
          const queued = [...state.queued]
          const idx = queued.findIndex((j) => j.id === id)
          if (idx === -1) return state
          const [item] = queued.splice(idx, 1)
          queued.splice(newPosition, 0, item)
          return { queued }
        })
      },

      pauseAll: async () => {
        try {
          await fetch('/api/batch/pause-all', { method: 'POST', credentials: 'include' })
          set({ error: null })
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Failed to pause' })
        }
      },

      resumeAll: async () => {
        try {
          await fetch('/api/batch/resume-all', { method: 'POST', credentials: 'include' })
          set({ error: null })
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Failed to resume' })
        }
      },

      clearError: () => set({ error: null }),

      onQueueUpdate: (running, queued) => set({ running, queued }),

      onJobCompleted: (jobId: string) => {
        set((state) => {
          const job = state.running.find((j) => j.id === jobId)
          if (!job) return state
          return {
            running: state.running.filter((j) => j.id !== jobId),
            completed: [{ ...job, status: 'completed' as const }, ...state.completed],
          }
        })
      },
    }),
    { name: 'queue-store' }
  )
)
