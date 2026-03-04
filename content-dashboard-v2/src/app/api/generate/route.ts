import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateImage } from '@/lib/generation'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_DEFAULTS, type ModelConfig, type ModelId, type NanoBananaProConfig, type NanoBanana2Config, type SeedanceConfig, type KlingConfig } from '@/lib/models'
import { validateModelConfig } from '@/lib/models/validator'
import { generationQueue, type QueueItem, type VideoQueueItem } from '@/lib/queue'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated')

if (!existsSync(GENERATED_DIR)) {
  mkdir(GENERATED_DIR, { recursive: true }).catch(console.error)
}

async function uploadToImgbb(base64Data: string): Promise<string | null> {
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY
  if (!IMGBB_API_KEY) return null

  try {
    const formData = new FormData()
    formData.append('image', base64Data)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return data.success ? data.data.url : null
  } catch {
    return null
  }
}

const IMAGE_MODELS = new Set<string>(['nano_banana_pro', 'nano_banana_2'])
const VIDEO_MODELS = new Set<string>(['seedance', 'kling'])
const ALL_MODELS = new Set<string>([...IMAGE_MODELS, ...VIDEO_MODELS])

export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()

    const {
      prompt,
      model = 'nano_banana_pro',
      characterId,
      presetId,
      aspect_ratio,
      resolution,
      negativePrompt,
      num_images,
      referenceImages,
      // Video-specific params
      duration,
      cfg_scale,
      camera_control,
      advanced_camera_control,
      watermark,
      generate_audio,
      seed,
      camerafixed,
      // Full model config override
      modelConfig,
    } = body as any

    // --- Validation ---
    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    if (!ALL_MODELS.has(model)) {
      return NextResponse.json(
        { error: `Invalid model. Must be one of: ${[...ALL_MODELS].join(', ')}` },
        { status: 400 }
      )
    }

    // --- Fetch character if provided ---
    let character = null
    if (characterId) {
      character = await prisma.character.findUnique({ where: { id: characterId } })
      if (!character) {
        return NextResponse.json({ error: `Character not found: ${characterId}` }, { status: 404 })
      }
    }

    // --- Fetch preset if provided ---
    let preset = null
    let presetParams: Record<string, any> = {}
    let presetReferenceUrl: string | null = null
    if (presetId) {
      preset = await prisma.characterPreset.findUnique({
        where: { id: presetId },
        include: { character: true },
      })
      if (!preset) {
        return NextResponse.json({ error: `Preset not found: ${presetId}` }, { status: 404 })
      }
      // Use preset's reference image
      presetReferenceUrl = preset.imageUrl || null
      // Use preset's generation params as defaults
      presetParams = (preset.generationParams as Record<string, any>) || {}
      // If no characterId explicitly provided, inherit from preset
      if (!characterId && preset.characterId) {
        character = preset.character
      }
    }

    // --- Build model config ---
    // Priority: explicit request params > preset params > model defaults
    const defaults = MODEL_DEFAULTS[model as ModelId]
    let resolvedConfig: ModelConfig

    if (modelConfig) {
      // Full override
      resolvedConfig = { ...defaults, ...presetParams, ...modelConfig, model } as ModelConfig
    } else if (IMAGE_MODELS.has(model)) {
      const base = defaults as NanoBananaProConfig | NanoBanana2Config
      resolvedConfig = {
        ...base,
        ...presetParams,
        model: model as any,
        aspect_ratio: aspect_ratio || presetParams.aspect_ratio || base.aspect_ratio,
        resolution: resolution || presetParams.resolution || base.resolution,
        num_images: num_images || presetParams.num_images || base.num_images,
      } as NanoBananaProConfig | NanoBanana2Config
    } else if (model === 'seedance') {
      const base = defaults as SeedanceConfig
      resolvedConfig = {
        ...base,
        ...presetParams,
        model: 'seedance' as const,
        duration: String(duration || presetParams.duration || base.duration) as SeedanceConfig['duration'],
        aspect_ratio: (aspect_ratio || presetParams.aspect_ratio || base.aspect_ratio) as SeedanceConfig['aspect_ratio'],
        resolution: (resolution || presetParams.resolution || base.resolution) as SeedanceConfig['resolution'],
        watermark: watermark ?? presetParams.watermark ?? base.watermark,
        generate_audio: generate_audio ?? presetParams.generate_audio ?? base.generate_audio,
        seed: seed ?? presetParams.seed ?? base.seed,
        camerafixed: camerafixed ?? presetParams.camerafixed ?? base.camerafixed,
      } as SeedanceConfig
    } else {
      // kling
      const base = defaults as KlingConfig
      resolvedConfig = {
        ...base,
        ...presetParams,
        model: 'kling' as const,
        duration: String(duration || presetParams.duration || base.duration) as KlingConfig['duration'],
        aspect_ratio: (aspect_ratio || presetParams.aspect_ratio || base.aspect_ratio) as KlingConfig['aspect_ratio'],
        cfg_scale: cfg_scale ?? presetParams.cfg_scale ?? base.cfg_scale,
        negative_prompt: negativePrompt || presetParams.negative_prompt || base.negative_prompt,
        camera_control: camera_control ?? presetParams.camera_control ?? base.camera_control,
        advanced_camera_control: advanced_camera_control ?? presetParams.advanced_camera_control ?? base.advanced_camera_control,
      } as KlingConfig
    }

    // Validate config
    const validation = validateModelConfig(resolvedConfig)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join('; ') }, { status: 400 })
    }

    // --- Build reference images list ---
    // Preset reference image first, then any manual reference images
    const refImages: string[] = []
    if (presetReferenceUrl) refImages.push(presetReferenceUrl)
    if (referenceImages && Array.isArray(referenceImages)) {
      refImages.push(...referenceImages)
    }

    const isVideo = VIDEO_MODELS.has(model)
    const contentType = isVideo ? 'video' : 'image'

    // --- Create ContentItem ---
    const contentItem = await prisma.contentItem.create({
      data: {
        title: `${isVideo ? 'Video' : 'Image'}: ${prompt.substring(0, 50)}`,
        prompt,
        negativePrompt: negativePrompt || null,
        generator: model,
        generationParams: {
          ...resolvedConfig,
          referenceImages: refImages.length > 0 ? refImages : undefined,
        } as any,
        status: isVideo ? 'queued' : 'generating',
        type: contentType,
        characterId: character?.id || null,
        presetId: preset?.id || null,
      },
    })

    if (isVideo) {
      // Queue video generation
      const queueItem: VideoQueueItem = {
        contentItemId: contentItem.id,
        prompt,
        modelConfig: resolvedConfig,
        referenceImageUrl: refImages[0] || null,
      }
      await generationQueue.addVideo(queueItem)

      return NextResponse.json({
        id: contentItem.id,
        title: contentItem.title,
        prompt: contentItem.prompt,
        model,
        status: 'queued',
        characterId: character?.id || null,
        presetId: preset?.id || null,
        imageUrl: null,
        videoUrl: null,
        createdAt: contentItem.createdAt,
        generationParams: contentItem.generationParams,
      })
    }

    // --- Synchronous image generation ---
    const result = await generateImage(
      prompt,
      resolvedConfig as NanoBananaProConfig | NanoBanana2Config,
      refImages.length > 0 ? refImages : null
    )

    if (!result.success) {
      await prisma.contentItem.update({
        where: { id: contentItem.id },
        data: { status: 'failed' },
      })
      return NextResponse.json(
        { error: result.error, id: contentItem.id, status: 'failed' },
        { status: 500 }
      )
    }

    // Save image
    const base64Data = result.imageUrl!.replace(/^data:image\/\w+;base64,/, '')
    const timestamp = Date.now()
    const filename = `gen_${timestamp}.jpg`
    const filepath = path.join(GENERATED_DIR, filename)
    const imageBuffer = Buffer.from(base64Data, 'base64')
    await writeFile(filepath, imageBuffer)

    const localUrl = `/generated/${filename}`
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    let publicUrl = `${baseUrl}${localUrl}`

    const imgbbUrl = await uploadToImgbb(base64Data)
    if (imgbbUrl) publicUrl = imgbbUrl

    // Update content item with image URL
    const updated = await prisma.contentItem.update({
      where: { id: contentItem.id },
      data: {
        imageUrl: publicUrl,
        status: 'completed',
      },
    })

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      prompt: updated.prompt,
      model,
      status: 'completed',
      characterId: character?.id || null,
      presetId: preset?.id || null,
      imageUrl: publicUrl,
      createdAt: updated.createdAt,
      generationParams: updated.generationParams,
    })
  } catch (error) {
    console.error('[API /api/generate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
