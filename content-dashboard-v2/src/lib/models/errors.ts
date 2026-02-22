export interface ModelError {
  code: string
  message: string
  retryable: boolean
  retryAfterMs?: number
}

export function mapProviderError(provider: string, statusCode: number, body: string): ModelError {
  if (provider === 'gemini') {
    if (statusCode === 429) return { code: 'RATE_LIMIT', message: 'Gemini rate limit hit. Wait a moment.', retryable: true, retryAfterMs: 10000 }
    if (statusCode === 400 && body.includes('SAFETY')) return { code: 'SAFETY', message: 'Content blocked by safety filter.', retryable: false }
    if (statusCode === 400 && body.includes('imageSize')) return { code: 'INVALID_PARAM', message: 'Invalid resolution for this aspect ratio. Try 2K.', retryable: false }
  }

  if (provider === 'fal') {
    if (statusCode === 422) return { code: 'VALIDATION', message: 'Invalid parameters for Seedance.', retryable: false }
    if (statusCode === 429) return { code: 'RATE_LIMIT', message: 'fal.ai rate limit. Retrying...', retryable: true, retryAfterMs: 5000 }
  }

  if (provider === 'kling') {
    if (statusCode === 429) return { code: 'RATE_LIMIT', message: 'Kling rate limit. Retrying...', retryable: true, retryAfterMs: 15000 }
    if (body.includes('INSUFFICIENT_BALANCE')) return { code: 'BALANCE', message: 'Kling account balance too low.', retryable: false }
  }

  return { code: 'UNKNOWN', message: `Generation failed (${statusCode})`, retryable: statusCode >= 500 }
}
