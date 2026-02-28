// ============ Model IDs ============

export type ModelId = 'nano_banana_pro' | 'nano_banana_2' | 'seedance' | 'kling'
export type ModelType = 'image' | 'video'

// ============ Per-Model Config Interfaces ============

/** Nano Banana Pro (Gemini 3 Pro Image) — Image generation */
export interface NanoBananaProConfig {
  model: 'nano_banana_pro'
  aspect_ratio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9'
  resolution: '1K' | '2K' | '4K'
  num_images: 1 | 2 | 3 | 4
}

/** Nano Banana 2 (Gemini 3.1 Flash Image) — Image generation */
export interface NanoBanana2Config {
  model: 'nano_banana_2'
  aspect_ratio:
    | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9'
    | '1:4' | '4:1' | '1:8' | '8:1'
  resolution: '0.5K' | '1K' | '2K' | '4K'
  num_images: 1 | 2 | 3 | 4
}

/** Seedance 1.5 Pro — Video generation via BytePlus ModelArk */
export interface SeedanceConfig {
  model: 'seedance'
  resolution: '480p' | '720p' | '1080p'
  duration: '5' | '10'
  aspect_ratio: '1:1' | '3:2' | '2:3' | '16:9' | '9:16' | '21:9' | '9:21'
  watermark: boolean
  generate_audio: boolean
  seed: number | null
  camerafixed: boolean
}

/** Kling v2 Master — Video generation via direct API */
export interface KlingConfig {
  model: 'kling'
  negative_prompt: string
  cfg_scale: number
  duration: '5' | '10'
  aspect_ratio: '1:1' | '16:9' | '9:16'
  camera_control: KlingCameraPreset | null
  advanced_camera_control: KlingAdvancedCamera | null
  // motion_brush, static_mask, dynamic_masks: Phase 2 (complex UI)
}

export type KlingCameraPreset =
  | 'simple' | 'move_left' | 'move_right' | 'move_up' | 'move_down'
  | 'push_in' | 'pull_out' | 'zoom_in' | 'zoom_out'
  | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down'
  | 'clockwise' | 'counterclockwise'

export interface KlingAdvancedCamera {
  horizontal: number
  vertical: number
  pan: number
  tilt: number
  roll: number
  zoom: number
}

// ============ Union Type ============

export type ModelConfig = NanoBananaProConfig | NanoBanana2Config | SeedanceConfig | KlingConfig

// ============ Generation Request ============

export interface GenerationRequest {
  prompt: string
  modelConfig: ModelConfig
  referenceImageUrl?: string | null
  referenceImages?: string[] | null
  characterId?: string | null
  presetId?: string | null
  negativePrompt?: string | null
}

// ============ Defaults ============

export const MODEL_DEFAULTS: Record<ModelId, ModelConfig> = {
  nano_banana_pro: {
    model: 'nano_banana_pro',
    aspect_ratio: '9:16',
    resolution: '2K',
    num_images: 1,
  },
  nano_banana_2: {
    model: 'nano_banana_2',
    aspect_ratio: '9:16',
    resolution: '1K',
    num_images: 1,
  },
  seedance: {
    model: 'seedance',
    resolution: '720p',
    duration: '5',
    aspect_ratio: '9:16',
    watermark: false,
    generate_audio: true,
    seed: null,
    camerafixed: false,
  },
  kling: {
    model: 'kling',
    negative_prompt: '',
    cfg_scale: 0.5,
    duration: '5',
    aspect_ratio: '9:16',
    camera_control: null,
    advanced_camera_control: null,
  },
}
