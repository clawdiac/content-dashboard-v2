import type { SeedanceConfig, KlingConfig } from '@/lib/models/types'
import { generateWithKlingBatch } from './kling-batch'
import { generateWithSeedanceBatch } from './seedance-batch'
import { generateWithVeoBatch } from './veo-batch'

export type BatchProvider = 'kling' | 'seedance' | 'veo'
export type BatchProviderResult = Awaited<ReturnType<typeof generateWithSeedanceBatch>>

export async function generateBatchVideo(
  provider: BatchProvider,
  prompt: string,
  config: SeedanceConfig | KlingConfig,
  referenceImageUrl?: string | null
): Promise<BatchProviderResult> {
  switch (provider) {
    case 'seedance':
      return generateWithSeedanceBatch(prompt, config as SeedanceConfig, referenceImageUrl)
    case 'kling':
      return generateWithKlingBatch(prompt, config as KlingConfig, referenceImageUrl)
    case 'veo':
      return generateWithVeoBatch()
    default:
      return { success: false, error: `Unknown batch provider: ${provider}` }
  }
}
