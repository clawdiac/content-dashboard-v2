import type { BatchConfig, Character, ImagePreset, VideoPreset, ApprovalStatus } from '@/types'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`)
  return res.json()
}

// === Batch API ===

export const batchApi = {
  create: (config: BatchConfig) =>
    request<{ batchId: string }>('/api/batch', { method: 'POST', body: JSON.stringify(config) }),

  get: (id: string) =>
    request<{ batch: unknown }>(`/api/batch/${id}`),

  list: () =>
    request<{ running: unknown[]; queued: unknown[]; completed: unknown[] }>('/api/batch'),

  retry: (id: string) =>
    request<void>(`/api/batch/${id}/retry`, { method: 'POST' }),
}

// === Content / Approval API ===

export const contentApi = {
  list: (params?: { status?: ApprovalStatus; batchId?: string }) => {
    const sp = new URLSearchParams()
    if (params?.status) sp.set('status', params.status)
    if (params?.batchId) sp.set('batchId', params.batchId)
    const qs = sp.toString()
    return request<{ items: unknown[] }>(`/api/content${qs ? `?${qs}` : ''}`)
  },

  updateStatus: (ids: string[], status: ApprovalStatus) =>
    request<void>('/api/content/status', { method: 'PATCH', body: JSON.stringify({ ids, status }) }),

  regenerate: (id: string) =>
    request<void>(`/api/content/${id}/regenerate`, { method: 'POST' }),
}

// === Character API ===

export const characterApi = {
  list: () => request<{ characters: Character[] }>('/api/characters'),
  get: (id: string) => request<Character>(`/api/characters/${id}`),
  create: (data: Partial<Character>) =>
    request<Character>('/api/characters', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Character>) =>
    request<Character>(`/api/characters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/api/characters/${id}`, { method: 'DELETE' }),
}

// === Preset API ===

export const presetApi = {
  listImage: () => request<{ presets: ImagePreset[] }>('/api/presets'),
  listVideo: () => request<{ presets: VideoPreset[] }>('/api/video-presets'),
  createVideo: (data: Partial<VideoPreset>) =>
    request<VideoPreset>('/api/video-presets', { method: 'POST', body: JSON.stringify(data) }),
  updateVideo: (id: string, data: Partial<VideoPreset>) =>
    request<VideoPreset>(`/api/video-presets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVideo: (id: string) =>
    request<void>(`/api/video-presets/${id}`, { method: 'DELETE' }),
}

// === Video API ===

export const videoApi = {
  batchGenerate: (imageIds: string[]) =>
    request<{ batchId: string }>('/api/video/batch', { method: 'POST', body: JSON.stringify({ imageIds }) }),

  get: (id: string) => request<unknown>(`/api/video/${id}`),
}
