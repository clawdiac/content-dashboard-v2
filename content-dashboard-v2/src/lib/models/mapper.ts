import type { ModelConfig, NanoBananaProConfig, NanoBanana2Config, SeedanceConfig, KlingConfig } from './types'

// ============ Nano Banana Pro → Gemini API ============

export function mapNanoBananaProRequest(
  prompt: string,
  config: NanoBananaProConfig | NanoBanana2Config,
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

// ============ Nano Banana 2 → Gemini API ============

export function mapNanoBanana2Request(
  prompt: string,
  config: NanoBanana2Config,
  referenceImageBase64?: { data: string; mimeType: string } | { data: string; mimeType: string }[] | null
) {
  return mapNanoBananaProRequest(prompt, config, referenceImageBase64)
}

// ============ Seedance → BytePlus ModelArk API ============

export function mapSeedanceRequest(
  prompt: string,
  config: SeedanceConfig,
  referenceImageUrl?: string | null
) {
  const promptParams = [
    prompt.trim(),
    `--ratio ${config.aspect_ratio}`,
    `--resolution ${config.resolution}`,
    `--duration ${config.duration}`,
    `--camerafixed ${config.camerafixed}`,
    `--watermark ${config.watermark}`,
  ]

  const content: Array<Record<string, any>> = [
    { type: 'text', text: promptParams.join(' ').trim() },
  ]

  if (referenceImageUrl) {
    content.push({ type: 'image_url', image_url: { url: referenceImageUrl } })
  }

  const body = {
    model: 'seedance-1-5-pro-251215',
    content,
  }

  return { endpoint: '/contents/generations/tasks', body }
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
    case 'nano_banana_2':
      return { provider: 'gemini' as const, payload: mapNanoBanana2Request(prompt, config, referenceImageBase64) }
    case 'seedance':
      return { provider: 'bytedance' as const, payload: mapSeedanceRequest(prompt, config, referenceImageUrl) }
    case 'kling':
      return { provider: 'kling' as const, payload: mapKlingRequest(prompt, config, referenceImageUrl) }
  }
}
