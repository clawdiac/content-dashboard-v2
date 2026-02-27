import type { KlingConfig } from '@/lib/models/types'
import { generateWithKling } from '@/lib/video-generation'

export interface KlingBatchResult {
  success: boolean
  videoUrl?: string
  requestId?: string
  status?: 'completed' | 'processing' | 'failed'
  seed?: number | null
  error?: string
}

export async function generateWithKlingBatch(
  prompt: string,
  config: KlingConfig,
  referenceImageUrl?: string | null
): Promise<KlingBatchResult> {
  const result = await generateWithKling(prompt, config, referenceImageUrl)

  const seedCandidate = (result as unknown as { seed?: unknown })?.seed
  const seed = typeof seedCandidate === 'number' ? seedCandidate : null

  return {
    success: result.success,
    videoUrl: result.videoUrl,
    requestId: result.requestId,
    status: result.status,
    error: result.error,
    seed,
  }
}
