import type { SeedanceConfig } from '@/lib/models/types'
import { generateWithSeedance } from '@/lib/video-generation'

export interface SeedanceBatchResult {
  success: boolean
  videoUrl?: string
  requestId?: string
  status?: 'completed' | 'processing' | 'failed'
  seed?: number | null
  error?: string
}

export async function generateWithSeedanceBatch(
  prompt: string,
  config: SeedanceConfig,
  referenceImageUrl?: string | null
): Promise<SeedanceBatchResult> {
  const result = await generateWithSeedance(prompt, config, referenceImageUrl)

  return {
    success: result.success,
    videoUrl: result.videoUrl,
    requestId: result.requestId,
    status: result.status,
    error: result.error,
    seed: config.seed ?? null,
  }
}
