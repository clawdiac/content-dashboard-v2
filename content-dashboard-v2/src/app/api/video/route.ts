import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generationQueue, type VideoQueueItem } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_DEFAULTS, type ModelConfig, type SeedanceConfig, type KlingConfig } from '@/lib/models'
import { validateModelConfig } from '@/lib/models/validator'

// POST /api/video — Generate a single video
export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      prompt,
      characterId,
      videoPresetId,
      model = 'seedance',
      referenceImageUrl,
      duration = 5,
      aspectRatio = '9:16',
      resolution = '720p',
      parentImageId,
      modelConfig,
    } = body as any

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    let resolvedRefUrl = referenceImageUrl || null
    let resolvedCharId = characterId || null
    let resolvedPrompt = prompt
    let resolvedDuration = duration
    let resolvedAspect = aspectRatio
    let resolvedResolution = resolution
    let resolvedModel = model

    if (videoPresetId) {
      const preset = await prisma.videoPreset.findUnique({
        where: { id: videoPresetId },
      })
      if (preset) {
        resolvedRefUrl = resolvedRefUrl || preset.referenceImageUrl
        resolvedCharId = resolvedCharId || preset.characterId
        resolvedDuration = duration || preset.duration
        resolvedAspect = aspectRatio || preset.aspectRatio
        resolvedResolution = resolution || preset.resolution
        resolvedModel = model || preset.model
        if (preset.promptTemplate && preset.promptTemplate.includes('{action}')) {
          resolvedPrompt = preset.promptTemplate.replace('{action}', prompt)
        }
      }
    }

    let resolvedConfig: ModelConfig

    if (modelConfig) {
      resolvedConfig = modelConfig as ModelConfig
    } else if (resolvedModel === 'kling') {
      const base = MODEL_DEFAULTS.kling as KlingConfig
      resolvedConfig = {
        ...base,
        duration: String(resolvedDuration) as KlingConfig['duration'],
        aspect_ratio: resolvedAspect as KlingConfig['aspect_ratio'],
      }
    } else {
      const base = MODEL_DEFAULTS.seedance as SeedanceConfig
      resolvedConfig = {
        ...base,
        duration: String(resolvedDuration) as SeedanceConfig['duration'],
        aspect_ratio: resolvedAspect as SeedanceConfig['aspect_ratio'],
        resolution: resolvedResolution as SeedanceConfig['resolution'],
      }
    }

    const validation = validateModelConfig(resolvedConfig)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join('; ') }, { status: 400 })
    }

    // Create content item
    const contentItem = await prisma.contentItem.create({
      data: {
        title: `Video: ${prompt.substring(0, 50)}`,
        prompt: resolvedPrompt,
        generator: resolvedConfig.model,
        generationParams: {
          ...resolvedConfig,
          referenceImageUrl: resolvedRefUrl,
        } as any,
        status: 'queued',
        type: 'video',
        characterId: resolvedCharId,
        videoPresetId: videoPresetId || null,
        parentImageId: parentImageId || null,
      },
    })

    const queueItem: VideoQueueItem = {
      contentItemId: contentItem.id,
      prompt: resolvedPrompt,
      modelConfig: resolvedConfig,
      referenceImageUrl: resolvedRefUrl,
    }

    await generationQueue.addVideo(queueItem)

    return NextResponse.json({
      id: contentItem.id,
      status: 'queued',
      prompt: resolvedPrompt,
      model: resolvedConfig.model,
    })
  } catch (error) {
    console.error('[API /api/video POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/video — List all video content items
export async function GET() {
  const { error: authError2 } = await requireApiAuth()
  if (authError2) return authError2

  try {
    const videos = await prisma.contentItem.findMany({
      where: { type: 'video' },
      orderBy: { createdAt: 'desc' },
      include: {
        character: true,
        videoPreset: true,
        batch: true,
      },
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error('[API /api/video GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
