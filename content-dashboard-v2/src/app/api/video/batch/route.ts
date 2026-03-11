import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generationQueue, type VideoQueueItem } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_DEFAULTS, type ModelConfig, type SeedanceConfig, type KlingConfig } from '@/lib/models'
import { validateModelConfig } from '@/lib/models/validator'

// POST /api/video/batch — Create a batch of video generations
export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      name,
      characterId,
      videoPresetId,
      model = 'seedance',
      duration = 5,
      aspectRatio = '9:16',
      resolution = '720p',
      items: rawItems,
      modelConfig,
      characterPresetIds,
    } = body as any

    const hasCharPresets = Array.isArray(characterPresetIds) && characterPresetIds.length > 0

    // Allow empty items array when characterPresetIds is provided
    let items: any[] = Array.isArray(rawItems) ? rawItems : []
    if (!hasCharPresets && items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Expand characterPresetIds into additional items
    let expandedItems = [...items]

    if (hasCharPresets) {
      const charPresets = await prisma.characterPreset.findMany({
        where: { id: { in: characterPresetIds } },
        include: { character: true },
      })

      const charPresetItems = charPresets.map((cp: any) => ({
        title: `${cp.character.name} — ${cp.name}`,
        prompt: body.prompt || '',
        referenceImageUrl: cp.imageUrl,
        characterId: cp.characterId,
        characterPresetId: cp.id,
      }))

      expandedItems = [...expandedItems, ...charPresetItems]
    }

    if (expandedItems.length === 0) {
      return NextResponse.json(
        { error: 'No items to process' },
        { status: 400 }
      )
    }

    if (expandedItems.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 videos per batch' },
        { status: 400 }
      )
    }

    // Resolve video preset
    let presetRefUrl: string | null = null
    let presetPromptTemplate: string | null = null
    let resolvedCharId = characterId || null
    let presetDuration = duration
    let presetAspect = aspectRatio
    let presetResolution = resolution
    let presetModel = model

    if (videoPresetId) {
      const preset = await prisma.videoPreset.findUnique({
        where: { id: videoPresetId },
      })
      if (preset) {
        presetRefUrl = preset.referenceImageUrl
        presetPromptTemplate = preset.promptTemplate
        resolvedCharId = resolvedCharId || preset.characterId
        presetDuration = preset.duration || duration
        presetAspect = preset.aspectRatio || aspectRatio
        presetResolution = preset.resolution || resolution
        presetModel = preset.model || model
      }
    }

    let baseConfig: ModelConfig
    if (modelConfig) {
      baseConfig = modelConfig as ModelConfig
    } else if (presetModel === 'kling') {
      const base = MODEL_DEFAULTS.kling as KlingConfig
      baseConfig = {
        ...base,
        duration: String(presetDuration) as KlingConfig['duration'],
        aspect_ratio: presetAspect as KlingConfig['aspect_ratio'],
      }
    } else {
      const base = MODEL_DEFAULTS.seedance as SeedanceConfig
      baseConfig = {
        ...base,
        duration: String(presetDuration) as SeedanceConfig['duration'],
        aspect_ratio: presetAspect as SeedanceConfig['aspect_ratio'],
        resolution: presetResolution as SeedanceConfig['resolution'],
      }
    }

    const baseValidation = validateModelConfig(baseConfig)
    if (!baseValidation.valid) {
      return NextResponse.json({ error: baseValidation.errors.join('; ') }, { status: 400 })
    }

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        name: name || `Video Batch ${new Date().toISOString().slice(0, 16)}`,
        type: 'video',
        status: 'processing',
        totalItems: expandedItems.length,
      },
    })

    // Create content items
    const contentItems = await Promise.all(
      expandedItems.map(async (item: any, index: number) => {
        let itemPrompt = item.prompt
        if (presetPromptTemplate && presetPromptTemplate.includes('{action}')) {
          itemPrompt = presetPromptTemplate.replace('{action}', item.prompt)
        }

        const refUrl = item.referenceImageUrl || presetRefUrl
        const itemConfig = (item.modelConfig || baseConfig) as ModelConfig

        const validation = validateModelConfig(itemConfig)
        if (!validation.valid) {
          throw new Error(validation.errors.join('; '))
        }

        return prisma.contentItem.create({
          data: {
            title: item.title || `${batch.name} #${index + 1}`,
            prompt: itemPrompt,
            generator: itemConfig.model,
            generationParams: {
              ...itemConfig,
              referenceImageUrl: refUrl,
            } as any,
            status: 'queued',
            type: 'video',
            batchId: batch.id,
            characterId: item.characterId || resolvedCharId,
            videoPresetId: item.videoPresetId || videoPresetId || null,
            parentImageId: item.parentImageId || null,
            position: index,
          },
        })
      })
    )

    const queueItems: VideoQueueItem[] = contentItems.map((ci) => {
      const params = ci.generationParams as any
      return {
        contentItemId: ci.id,
        batchId: batch.id,
        prompt: ci.prompt,
        modelConfig: params as ModelConfig,
        referenceImageUrl: params?.referenceImageUrl || null,
      }
    })

    await generationQueue.addManyVideos(queueItems)

    return NextResponse.json({
      batchId: batch.id,
      name: batch.name,
      type: 'video',
      status: batch.status,
      totalItems: batch.totalItems,
      items: contentItems.map((ci) => ({
        id: ci.id,
        status: ci.status,
        position: ci.position,
        prompt: ci.prompt,
      })),
    })
  } catch (error) {
    console.error('[API /api/video/batch POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
