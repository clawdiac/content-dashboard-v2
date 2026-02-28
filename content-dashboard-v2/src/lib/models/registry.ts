import type { ModelId, ModelType } from './types'

export interface ParamSpec {
  key: string
  label: string
  type: 'select' | 'toggle' | 'number' | 'text' | 'slider' | 'camera-6axis'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  default: any
  required: boolean
  description?: string
}

export interface ModelRegistryEntry {
  id: ModelId
  name: string
  type: ModelType
  provider: 'gemini' | 'fal' | 'kling'
  envKeys: string[]
  supportsReferenceImage: boolean
  costEstimate: string
  params: ParamSpec[]
}

export const MODEL_REGISTRY: Record<ModelId, ModelRegistryEntry> = {
  nano_banana_pro: {
    id: 'nano_banana_pro',
    name: 'Nano Banana Pro',
    type: 'image',
    provider: 'gemini',
    envKeys: ['GEMINI_API_KEY'],
    supportsReferenceImage: true,
    costEstimate: '~$0.03–0.08/img',
    params: [
      {
        key: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '2:3', label: '2:3' },
          { value: '3:2', label: '3:2' },
          { value: '3:4', label: '3:4' },
          { value: '4:3', label: '4:3' },
          { value: '4:5', label: '4:5' },
          { value: '5:4', label: '5:4' },
          { value: '9:16', label: '9:16' },
          { value: '16:9', label: '16:9' },
          { value: '21:9', label: '21:9' },
        ],
        default: '9:16',
        required: false,
      },
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        options: [
          { value: '1K', label: '1K (Fast)' },
          { value: '2K', label: '2K (Standard)' },
          { value: '4K', label: '4K (High Quality)' },
        ],
        default: '2K',
        required: false,
      },
      {
        key: 'num_images',
        label: 'Number of Images',
        type: 'number',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
        required: false,
      },
    ],
  },
  nano_banana_2: {
    id: 'nano_banana_2',
    name: 'Nano Banana 2',
    type: 'image',
    provider: 'gemini',
    envKeys: ['GEMINI_API_KEY'],
    supportsReferenceImage: true,
    costEstimate: '~$0.045–0.15/img',
    params: [
      {
        key: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '2:3', label: '2:3' },
          { value: '3:2', label: '3:2' },
          { value: '3:4', label: '3:4' },
          { value: '4:3', label: '4:3' },
          { value: '4:5', label: '4:5' },
          { value: '5:4', label: '5:4' },
          { value: '9:16', label: '9:16' },
          { value: '16:9', label: '16:9' },
          { value: '21:9', label: '21:9' },
          { value: '1:4', label: '1:4' },
          { value: '4:1', label: '4:1' },
          { value: '1:8', label: '1:8' },
          { value: '8:1', label: '8:1' },
        ],
        default: '9:16',
        required: false,
      },
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        options: [
          { value: '0.5K', label: '0.5K (Fastest)' },
          { value: '1K', label: '1K (Fast)' },
          { value: '2K', label: '2K (Standard)' },
          { value: '4K', label: '4K (High Quality)' },
        ],
        default: '1K',
        required: false,
      },
      {
        key: 'num_images',
        label: 'Number of Images',
        type: 'number',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
        required: false,
      },
    ],
  },

  seedance: {
    id: 'seedance',
    name: 'Seedance 1.5 Pro',
    type: 'video',
    provider: 'fal',
    envKeys: ['FAL_KEY'],
    supportsReferenceImage: true,
    costEstimate: '~$0.15–0.62/clip',
    params: [
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        options: [
          { value: '480p', label: '480p' },
          { value: '720p', label: '720p HD' },
          { value: '1080p', label: '1080p Full HD' },
        ],
        default: '720p',
        required: false,
      },
      {
        key: 'duration',
        label: 'Duration',
        type: 'select',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
        default: '5',
        required: false,
      },
      {
        key: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '3:2', label: '3:2' },
          { value: '2:3', label: '2:3' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '21:9', label: '21:9' },
          { value: '9:21', label: '9:21' },
        ],
        default: '9:16',
        required: false,
      },
      {
        key: 'watermark',
        label: 'Watermark',
        type: 'toggle',
        default: false,
        required: false,
        description: 'Add watermark to output',
      },
      {
        key: 'seed',
        label: 'Seed',
        type: 'number',
        min: 0,
        max: 2147483647,
        default: null,
        required: false,
        description: 'For reproducible results',
      },
      {
        key: 'camerafixed',
        label: 'Fixed Camera',
        type: 'toggle',
        default: false,
        required: false,
        description: 'Lock camera position during generation',
      },
    ],
  },

  kling: {
    id: 'kling',
    name: 'Kling AI',
    type: 'video',
    provider: 'kling',
    envKeys: ['KLING_ACCESS_KEY', 'KLING_SECRET_KEY'],
    supportsReferenceImage: true,
    costEstimate: '~$0.14–0.56/clip',
    params: [
      {
        key: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'text',
        default: '',
        required: false,
        description: 'What to avoid in the video',
      },
      {
        key: 'cfg_scale',
        label: 'CFG Scale',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.5,
        required: false,
        description: 'How closely to follow the prompt (0=creative, 1=strict)',
      },
      {
        key: 'duration',
        label: 'Duration',
        type: 'select',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
        default: '5',
        required: false,
      },
      {
        key: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
        ],
        default: '9:16',
        required: false,
      },
      {
        key: 'camera_control',
        label: 'Camera Movement',
        type: 'select',
        options: [
          { value: '', label: 'None' },
          { value: 'simple', label: 'Simple' },
          { value: 'move_left', label: 'Move Left' },
          { value: 'move_right', label: 'Move Right' },
          { value: 'move_up', label: 'Move Up' },
          { value: 'move_down', label: 'Move Down' },
          { value: 'push_in', label: 'Push In' },
          { value: 'pull_out', label: 'Pull Out' },
          { value: 'zoom_in', label: 'Zoom In' },
          { value: 'zoom_out', label: 'Zoom Out' },
          { value: 'pan_left', label: 'Pan Left' },
          { value: 'pan_right', label: 'Pan Right' },
          { value: 'tilt_up', label: 'Tilt Up' },
          { value: 'tilt_down', label: 'Tilt Down' },
          { value: 'clockwise', label: 'Clockwise' },
          { value: 'counterclockwise', label: 'Counter-clockwise' },
        ],
        default: null,
        required: false,
        description: 'Preset camera movement',
      },
      {
        key: 'advanced_camera_control',
        label: 'Advanced Camera (6-axis)',
        type: 'camera-6axis',
        min: -10,
        max: 10,
        step: 1,
        default: null,
        required: false,
        description: 'Fine-grained 6-axis camera control. Overrides camera_control preset.',
      },
    ],
  },
}

// Dynamic cost estimation based on selected params
export function estimateCost(modelId: ModelId, params: Record<string, any>): number {
  switch (modelId) {
    case 'nano_banana_pro': {
      const res = params.resolution || '2K'
      const numImages = params.num_images || 1
      const perImage = res === '1K' ? 0.03 : res === '2K' ? 0.06 : 0.08
      return perImage * numImages
    }
    case 'nano_banana_2': {
      const res = params.resolution || '1K'
      const numImages = params.num_images || 1
      const perImage =
        res === '0.5K' ? 0.045 :
        res === '1K' ? 0.067 :
        res === '2K' ? 0.101 :
        0.151
      return perImage * numImages
    }
    case 'seedance': {
      const res = params.resolution || '720p'
      const dur = parseInt(params.duration || '5', 10)
      // Base cost per 5s by resolution (fal.ai actual pricing)
      const base = res === '480p' ? 0.15 : res === '720p' ? 0.35 : 0.62
      return dur === 10 ? base * 1.8 : base
    }
    case 'kling': {
      const dur = parseInt(params.duration || '5', 10)
      // Standard mode pricing (credit-based)
      // Std 5s: $0.14, Std 10s: $0.28
      return dur === 10 ? 0.28 : 0.14
    }
    default:
      return 0
  }
}

// Helpers
export function getModelsByType(type: ModelType): ModelRegistryEntry[] {
  return Object.values(MODEL_REGISTRY).filter(m => m.type === type)
}

export function getModelSpec(id: ModelId): ModelRegistryEntry {
  return MODEL_REGISTRY[id]
}
