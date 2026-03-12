import { randomUUID } from 'crypto'
import type { CharacterJson } from './character-randomizer'

export interface CharGenCharacter {
  name: string
  characterJson: CharacterJson
  prompt: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  characterId?: string
  presetId?: string
  imageUrl?: string
  error?: string
}

export interface CharGenJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  referenceImageUrl: string
  characterJson: CharacterJson
  randomizeConfig: object
  presetName: string
  characters: CharGenCharacter[]
  completedCount: number
  failedCount: number
  genParams: { aspect_ratio: string; resolution: string; num_images: number }
  createdAt: Date
}

// Hot-reload-safe in-memory store (survives Next.js HMR in dev)
declare global {
  // eslint-disable-next-line no-var
  var __charGenJobs: Map<string, CharGenJob> | undefined
}
const jobs: Map<string, CharGenJob> = globalThis.__charGenJobs ?? (globalThis.__charGenJobs = new Map())

export function createJob(data: Omit<CharGenJob, 'id' | 'status' | 'completedCount' | 'failedCount' | 'createdAt'>): CharGenJob {
  const job: CharGenJob = {
    ...data,
    id: randomUUID(),
    status: 'pending',
    completedCount: 0,
    failedCount: 0,
    createdAt: new Date(),
  }
  jobs.set(job.id, job)
  return job
}

export function getJob(jobId: string): CharGenJob | undefined {
  return jobs.get(jobId)
}

export function updateCharacterStatus(
  jobId: string,
  characterIndex: number,
  update: Partial<CharGenCharacter>
): CharGenJob | null {
  const job = jobs.get(jobId)
  if (!job) return null

  job.characters[characterIndex] = { ...job.characters[characterIndex], ...update }

  // Recount
  job.completedCount = job.characters.filter((c) => c.status === 'completed').length
  job.failedCount = job.characters.filter((c) => c.status === 'failed').length
  const total = job.characters.length
  const done = job.completedCount + job.failedCount

  if (done === total) {
    job.status = job.failedCount === total ? 'failed' : 'completed'
  } else if (done > 0 || job.characters.some((c) => c.status === 'generating')) {
    job.status = 'processing'
  }

  jobs.set(jobId, job)
  return job
}

export function getNextPendingIndex(jobId: string): number {
  const job = jobs.get(jobId)
  if (!job) return -1
  return job.characters.findIndex((c) => c.status === 'pending')
}

/**
 * Atomically claim the next pending character (find + mark as generating).
 * Returns the index, or -1 if none pending.
 */
export function claimNextPending(jobId: string): number {
  const job = jobs.get(jobId)
  if (!job) return -1
  const idx = job.characters.findIndex((c) => c.status === 'pending')
  if (idx === -1) return -1
  job.characters[idx] = { ...job.characters[idx], status: 'generating' }
  job.status = 'processing'
  jobs.set(jobId, job)
  return idx
}
