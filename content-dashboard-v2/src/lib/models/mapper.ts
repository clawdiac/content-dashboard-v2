import type { ModelConfig, NanoBananaProConfig, SeedanceConfig, KlingConfig } from './types'

// ============ Nano Banana Pro → Gemini API ============

export function mapNanoBananaProRequest(
  prompt: string,
  config: NanoBananaProConfig,
  referenceImageBase64?: { data: string; mimeType: string } | { data: string; mimeType: string }[] | null
) {
  const parts: any[] = []

  // Normalize to array
  const refImages = referenceImageBase64
    ? (Array.isArray(referenceImageBase64) ? referenceImageBase64 : [referenceImageBase64])
    : []

  if (refImages.length > 0) {
    for (const img of refImages) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data,
        },
      })
    }
    // Generic reference instruction - don't assume content type
    const refText = refImages.length > 1 ? 'these reference images' : 'this reference image'
    parts.push({ text: `Use this for style/composition reference: ${refText}. Generate: ${prompt}` })
  } else {
    parts.push({ text: prompt })
  }

  return {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: config.aspect_ratio,
        imageSize: config.resolution,
      },
    },
  }
}

// ============ Seedance → fal.ai API ============

export function mapSeedanceRequest(
  prompt: string,
  config: SeedanceConfig,
  referenceImageUrl?: string | null
) {
  const input: Record<string, any> = {
    prompt,
    duration: config.duration,
    resolution: config.resolution,
    enable_safety_checker: false,
    generate_audio: true,
  }

  if (config.aspect_ratio) {
    input.aspect_ratio = config.aspect_ratio
  }
  if (referenceImageUrl) {
    input.image_url = referenceImageUrl
  }
  if (config.seed !== null && config.seed !== undefined) {
    input.seed = config.seed
  }
  if (config.watermark !== undefined) {
    input.watermark = config.watermark
  }
  if (config.camerafixed) {
    input.camerafixed = config.camerafixed
  }

  const modelId = referenceImageUrl
    ? 'fal-ai/bytedance/seedance/v1.5/pro/image-to-video'
    : 'fal-ai/bytedance/seedance/v1/pro/text-to-video'

  return { modelId, input }
}

// ============ Kling → Kling Direct API ============

export function mapKlingRequest(
  prompt: string,
  config: KlingConfig,
  referenceImageUrl?: string | null
) {
  const body: Record<string, any> = {
    model_name: 'kling-v2-master',
    prompt,
    duration: config.duration,
    aspect_ratio: config.aspect_ratio,
    mode: 'std',
  }

  if (config.negative_prompt) {
    body.negative_prompt = config.negative_prompt
  }
  if (config.cfg_scale !== undefined) {
    body.cfg_scale = config.cfg_scale
  }
  if (referenceImageUrl) {
    body.image_url = referenceImageUrl
  }
  if (config.camera_control) {
    body.camera_control = { type: config.camera_control }
  }
  if (config.advanced_camera_control) {
    body.camera_control = {
      type: 'custom',
      config: {
        horizontal: config.advanced_camera_control.horizontal,
        vertical: config.advanced_camera_control.vertical,
        pan: config.advanced_camera_control.pan,
        tilt: config.advanced_camera_control.tilt,
        roll: config.advanced_camera_control.roll,
        zoom: config.advanced_camera_control.zoom,
      },
    }
  }

  const endpoint = referenceImageUrl
    ? '/v1/videos/image2video'
    : '/v1/videos/text2video'

  return { endpoint, body }
}

// ============ Universal Mapper ============

export function mapConfigToApiRequest(
  prompt: string,
  config: ModelConfig,
  referenceImageUrl?: string | null,
  referenceImageBase64?: { data: string; mimeType: string } | { data: string; mimeType: string }[] | null
) {
  switch (config.model) {
    case 'nano_banana_pro':
      return { provider: 'gemini' as const, payload: mapNanoBananaProRequest(prompt, config, referenceImageBase64) }
    case 'seedance':
      return { provider: 'fal' as const, payload: mapSeedanceRequest(prompt, config, referenceImageUrl) }
    case 'kling':
      return { provider: 'kling' as const, payload: mapKlingRequest(prompt, config, referenceImageUrl) }
  }
}
