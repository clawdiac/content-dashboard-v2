export interface VeoBatchResult {
  success: boolean
  videoUrl?: string
  requestId?: string
  status?: 'completed' | 'processing' | 'failed'
  seed?: number | null
  error?: string
}

export async function generateWithVeoBatch(): Promise<VeoBatchResult> {
  return {
    success: false,
    error: 'Veo not yet implemented',
  }
}
