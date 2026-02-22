import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { contentApi, videoApi } from '@/lib/api'
import type { ApprovalItem, ApprovalFilter, ApprovalStatus } from '@/types'

interface ApprovalState {
  items: ApprovalItem[]
  selected: Set<string>
  filter: ApprovalFilter
  loading: boolean
  error: string | null

  fetchItems: () => Promise<void>
  addItem: (item: ApprovalItem) => void

  approve: (ids: string[]) => Promise<void>
  reject: (ids: string[]) => Promise<void>
  regenerate: (ids: string[]) => Promise<void>
  sendToVideoGen: (ids: string[]) => Promise<void>

  toggleSelect: (id: string) => void
  selectAll: () => void
  selectNone: () => void
  selectRange: (from: string, to: string) => void

  setFilter: (filter: Partial<ApprovalFilter>) => void
  resetStatus: (ids: string[]) => Promise<void>
  clearError: () => void

  filteredItems: () => ApprovalItem[]
  selectedItems: () => ApprovalItem[]
}

async function optimisticStatusUpdate(
  set: (fn: (s: ApprovalState) => Partial<ApprovalState>) => void,
  get: () => ApprovalState,
  ids: string[],
  status: ApprovalStatus,
) {
  const previousItems = get().items
  // Optimistic update
  set((state) => ({
    items: state.items.map((item) =>
      ids.includes(item.id) ? { ...item, approvalStatus: status, reviewedAt: new Date().toISOString() } : item
    ),
    error: null,
  }))
  try {
    await contentApi.updateStatus(ids, status)
  } catch (e) {
    // Rollback
    set(() => ({
      items: previousItems,
      error: e instanceof Error ? e.message : `Failed to update status to ${status}`,
    }))
  }
}

export const useApprovalStore = create<ApprovalState>()(
  devtools(
    (set, get) => ({
      items: [],
      selected: new Set(),
      filter: { status: 'all', sortBy: 'newest' },
      loading: false,
      error: null,

      fetchItems: async () => {
        set({ loading: true, error: null })
        try {
          const data = await contentApi.list()
          set({ items: (data.items ?? data) as ApprovalItem[], loading: false })
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch items' })
        }
      },

      addItem: (item: ApprovalItem) => {
        set((state) => ({ items: [item, ...state.items] }))
      },

      approve: (ids: string[]) => optimisticStatusUpdate(set, get, ids, 'approved'),
      reject: (ids: string[]) => optimisticStatusUpdate(set, get, ids, 'rejected'),
      resetStatus: (ids: string[]) => optimisticStatusUpdate(set, get, ids, 'pending'),

      regenerate: async (ids: string[]) => {
        try {
          for (const id of ids) await contentApi.regenerate(id)
          set({ error: null })
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Failed to regenerate' })
        }
      },

      sendToVideoGen: async (ids: string[]) => {
        try {
          await videoApi.batchGenerate(ids)
          set({ error: null })
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Failed to send to video gen' })
        }
      },

      toggleSelect: (id: string) => {
        set((state) => {
          const selected = new Set(state.selected)
          if (selected.has(id)) selected.delete(id)
          else selected.add(id)
          return { selected }
        })
      },

      selectAll: () => {
        const items = get().filteredItems()
        set({ selected: new Set(items.map((i) => i.id)) })
      },

      selectNone: () => set({ selected: new Set() }),

      selectRange: (from: string, to: string) => {
        const items = get().filteredItems()
        const fromIdx = items.findIndex((i) => i.id === from)
        const toIdx = items.findIndex((i) => i.id === to)
        if (fromIdx === -1 || toIdx === -1) return
        const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
        const rangeIds = items.slice(start, end + 1).map((i) => i.id)
        set((state) => {
          const selected = new Set(state.selected)
          rangeIds.forEach((id) => selected.add(id))
          return { selected }
        })
      },

      setFilter: (filter: Partial<ApprovalFilter>) => {
        set((state) => ({ filter: { ...state.filter, ...filter } }))
      },

      clearError: () => set({ error: null }),

      filteredItems: () => {
        const { items, filter } = get()
        let filtered = items
        if (filter.status !== 'all') {
          filtered = filtered.filter((i) => i.approvalStatus === filter.status)
        }
        if (filter.batchId) {
          filtered = filtered.filter((i) => i.batchId === filter.batchId)
        }
        if (filter.characterId) {
          filtered = filtered.filter((i) => i.character.id === filter.characterId)
        }
        if (filter.type) {
          filtered = filtered.filter((i) => i.type === filter.type)
        }
        switch (filter.sortBy) {
          case 'newest':
            filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            break
          case 'character':
            filtered = [...filtered].sort((a, b) => a.character.name.localeCompare(b.character.name))
            break
          case 'preset':
            filtered = [...filtered].sort((a, b) => a.preset.name.localeCompare(b.preset.name))
            break
        }
        return filtered
      },

      selectedItems: () => {
        const { items, selected } = get()
        return items.filter((i) => selected.has(i.id))
      },
    }),
    { name: 'approval-store' }
  )
)
