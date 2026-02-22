// === Core Types ===

export interface Character {
  id: string
  name: string
  displayName: string
  avatarUrl?: string
  loraPath?: string
  triggerWord?: string
  defaultPromptSuffix?: string
}

export interface ImagePreset {
  id: string
  name: string
  displayName: string
  thumbnailUrl?: string
  promptTemplate: string
  negativePrompt?: string
  width: number
  height: number
  steps: number
  cfg: number
  sampler: string
  scheduler: string
}

export interface VideoPreset {
  id: string
  name: string
  displayName: string
  thumbnailUrl?: string
  model: string
  duration: number
  motionPrompt?: string
  referenceImageUrl?: string
  fps: number
  width: number
  height: number
}

// === Batch Types ===

export type BatchType = 'image' | 'video' | 'mixed'
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface BatchStats {
  total: number
  completed: number
  failed: number
  inProgress: number
}

export interface Batch {
  id: string
  type: BatchType
  status: 'running' | 'paused' | 'completed' | 'cancelled'
  jobs: Job[]
  createdAt: string
  completedAt?: string
  stats: BatchStats
}

export interface Job {
  id: string
  batchId: string
  type: 'image' | 'video'
  status: JobStatus
  character: Character
  preset: ImagePreset | VideoPreset
  progress: number
  promptId?: string
  outputUrl?: string
  thumbnailUrl?: string
  error?: string
  startedAt?: string
  completedAt?: string
  durationMs?: number
  seed?: number
  metadata?: Record<string, unknown>
}

export interface ApprovalItem {
  id: string
  jobId: string
  batchId: string
  type: 'image' | 'video'
  character: Character
  preset: ImagePreset | VideoPreset
  outputUrl: string
  thumbnailUrl: string
  approvalStatus: ApprovalStatus
  note?: string
  createdAt: string
  reviewedAt?: string
  seed?: number
  eligibleForVideo: boolean
}

export interface ApprovalFilter {
  status: ApprovalStatus | 'all'
  batchId?: string
  characterId?: string
  type?: 'image' | 'video'
  sortBy: 'newest' | 'character' | 'preset'
}

export interface QueueJob {
  id: string
  batchId: string
  type: BatchType
  status: 'running' | 'queued' | 'completed'
  progress: number
  totalJobs: number
  completedJobs: number
  estimatedTimeRemaining?: number
  createdAt: string
}

export interface BatchConfig {
  type: BatchType
  characterIds: string[]
  presetIds: string[]
  seed?: number
  steps?: number
  cfg?: number
}

// === SSE Event Types ===

export type SSEEventType =
  | 'batch:created'
  | 'job:started'
  | 'job:progress'
  | 'job:completed'
  | 'job:failed'
  | 'batch:completed'
  | 'video:started'
  | 'video:completed'
  | 'video:failed'

export interface SSEBatchCreated { batchId: string; totalJobs: number }
export interface SSEJobStarted { batchId: string; jobId: string; promptId: string }
export interface SSEJobProgress { batchId: string; jobId: string; progress: number; preview?: string }
export interface SSEJobCompleted { batchId: string; jobId: string; outputUrl: string; thumbnailUrl: string; metadata?: Record<string, unknown> }
export interface SSEJobFailed { batchId: string; jobId: string; error: string }
export interface SSEBatchCompleted { batchId: string; stats: BatchStats }
export interface SSEVideoStarted { batchId: string; jobId: string }
export interface SSEVideoCompleted { batchId: string; jobId: string; outputUrl: string }
export interface SSEVideoFailed { batchId: string; jobId: string; error: string }

// === Model Types ===

export type {
  ModelId,
  ModelType,
  ModelConfig,
  NanoBananaProConfig,
  SeedanceConfig,
  KlingConfig,
  KlingCameraPreset,
  KlingAdvancedCamera,
  GenerationRequest,
} from '@/lib/models/types'
