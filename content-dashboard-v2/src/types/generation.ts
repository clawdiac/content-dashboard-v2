// Type definitions for all generation API requests/responses

// ============ Image Generation (Nano Banana / Gemini) ============

export type GeneratorModel = 'nano_banana_pro' | 'nano_banana_2' | 'kling' | 'seedance'

export type AspectRatio =
  | '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  | '21:9' | '9:21' | '2:3' | '3:2' | '9:8'

export type Resolution = '1024' | '1536' | '2048'
export type QualityLabel = '0.5K' | '1K' | '2K' | '4K'

export interface ImageGenerationRequest {
  prompt: string
  negativePrompt?: string
  model: GeneratorModel
  aspectRatio?: AspectRatio | string
  quality?: QualityLabel | string
  width?: number
  height?: number
  seed?: number | null
  referenceImageUrl?: string | null
}

export interface ImageGenerationResult {
  success: boolean
  imageUrl?: string   // base64 data:image/png URL or remote URL
  error?: string
}

// Gemini API types
export interface GeminiContentPart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

export interface GeminiRequest {
  contents: Array<{
    parts: GeminiContentPart[]
  }>
  generationConfig: {
    responseModalities: string[]
    imageConfig?: {
      aspectRatio?: string
      imageSize?: string
    }
  }
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        inlineData?: {
          mimeType: string
          data: string
        }
      }>
    }
  }>
}

// ============ Video Generation (Seedance + Kling) ============

export type VideoModel = 'seedance' | 'kling'

export interface VideoGenerationRequest {
  prompt: string
  model: VideoModel
  referenceImageUrl?: string | null
  duration?: number        // seconds (2-12 for Seedance, 5-10 for Kling)
  aspectRatio?: string
  resolution?: string      // "480p", "720p", "1080p"
  seed?: number
  extraParams?: Record<string, unknown>
}

export interface VideoGenerationResult {
  success: boolean
  videoUrl?: string
  requestId?: string
  status?: 'completed' | 'processing' | 'failed'
  error?: string
}

// Seedance (fal.ai) types
export interface SeedanceInput {
  prompt: string
  duration: string
  resolution: string
  enable_safety_checker: boolean
  generate_audio: boolean
  aspect_ratio?: string
  image_url?: string
  seed?: number
}

export interface SeedanceResponse {
  video?: {
    url: string
  }
}

// Kling API types
export interface KlingJWTPayload {
  iss: string
  exp: number
  nbf: number
}

export interface KlingSubmitRequest {
  model_name: string
  prompt: string
  duration: string
  aspect_ratio: string
  mode: string
  image_url?: string
}

export interface KlingSubmitResponse {
  data?: {
    task_id: string
  }
}

export interface KlingPollResponse {
  data?: {
    task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
    task_status_msg?: string
    task_result?: {
      videos?: Array<{
        url: string
      }>
    }
  }
}

// ============ API Key Management ============

export type ApiKeyType = 'google' | 'fal' | 'kling'

export interface ApiKeyRequest {
  keyType: ApiKeyType
  value: string
}

export interface ApiKeyResponse {
  success: boolean
  message: string
}

// ============ Queue Types ============

export interface QueueItem {
  contentItemId: string
  batchId?: string
  prompt: string
  negativePrompt?: string
  model: GeneratorModel
  aspectRatio?: string
  quality?: string
  referenceImageUrl?: string | null
  seed?: number | null
}

export interface VideoQueueItem {
  contentItemId: string
  batchId?: string
  prompt: string
  model: VideoModel
  referenceImageUrl?: string | null
  duration?: number
  aspectRatio?: string
  resolution?: string
  seed?: number
  extraParams?: Record<string, unknown>
}

export interface QueueStatus {
  queued: number
  processing: number
  maxConcurrent: number
  videoQueued: number
  videoProcessing: number
}
