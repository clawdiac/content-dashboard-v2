import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generationQueue, type QueueItem, type VideoQueueItem } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_REGISTRY, type ModelConfig } from '@/lib/models'
import { validateModelConfig } from '@/lib/models/validator'

// POST /api/batch — Create a batch of generations
export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      name,
      characterId,
      presetId,
      campaignName,
      templatePresetId,
      outputsPerCharacter = 1,
      items,
      modelConfig,
    } = body as {
      name?: string
      characterId?: string
      presetId?: string
      campaignName?: string
      templatePresetId?: string
      outputsPerCharacter?: number
      items: any[]
      modelConfig: ModelConfig
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (items.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 items per batch' },
        { status: 400 }
      )
    }

    if (!modelConfig) {
      return NextResponse.json(
        { error: 'modelConfig is required' },
        { status: 400 }
      )
    }

    const baseValidation = validateModelConfig(modelConfig)
    if (!baseValidation.valid) {
      return NextResponse.json({ error: baseValidation.errors.join('; ') }, { status: 400 })
    }

    const baseType = MODEL_REGISTRY[modelConfig.model].type

    const invalidItem = items.find((item) => {
      const cfg = (item.modelConfig || modelConfig) as ModelConfig
      const validation = validateModelConfig(cfg)
      if (!validation.valid) return true
      const itemType = MODEL_REGISTRY[cfg.model].type
      return itemType !== baseType
    })

    if (invalidItem) {
      return NextResponse.json(
        { error: 'All items must use a valid modelConfig of the same type as the batch modelConfig' },
        { status: 400 }
      )
    }

    let resolvedCharacterId = characterId || null

    // Note: preset image resolution now happens per-item, not at batch level
    // This prevents preset images from being shared across items that shouldn't have them

    // Create batch record
    const batch = await prisma.batch.create({
      data: {
        name: name || `Batch ${new Date().toISOString().slice(0, 16)}`,
        type: baseType,
        status: 'processing',
        totalItems: items.length,
        campaignName: campaignName || null,
        templatePresetId: templatePresetId || null,
        rerunnable: !!campaignName,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:4000'

    // Create content items for each entry
    const contentItems = await Promise.all(
      items.map(async (item: any, index: number) => {
        const itemCharacterId = item.characterId || resolvedCharacterId
        const itemPresetId = item.presetId || presetId || null
        const itemModelConfig = (item.modelConfig || modelConfig) as ModelConfig

        // Resolve preset image: use explicit presetImageUrl from item, or look up from DB
        let itemPresetImageUrl: string | null = item.presetImageUrl || null
        if (!itemPresetImageUrl && itemPresetId) {
          const itemPreset = await prisma.characterPreset.findUnique({
            where: { id: itemPresetId },
          })
          if (itemPreset) {
            itemPresetImageUrl = itemPreset.imageUrl
          }
        }

        // Resolve URLs to absolute
        if (itemPresetImageUrl && !itemPresetImageUrl.startsWith('http') && !itemPresetImageUrl.startsWith('data:')) {
          itemPresetImageUrl = `${baseUrl}${itemPresetImageUrl}`
        }

        // Manual reference images (separate from preset)
        let manualRefs: string[] | null = item.manualReferenceImages || null
        if (manualRefs) {
          manualRefs = manualRefs.map((url: string) => {
            if (url && !url.startsWith('http') && !url.startsWith('data:')) {
              return `${baseUrl}${url}`
            }
            return url
          }).filter(Boolean)
        }

        console.log(`[API /api/batch] Item ${index}: preset=${itemPresetImageUrl?.slice(0, 60) || 'none'}, manualRefs=${manualRefs?.length || 0}`)

        const contentItem = await prisma.contentItem.create({
          data: {
            title: item.title || `${batch.name} #${index + 1}`,
            prompt: item.prompt,
            negativePrompt: item.negativePrompt || null,
            generator: itemModelConfig.model,
            generationParams: {
              ...itemModelConfig,
              presetImageUrl: itemPresetImageUrl,
              manualReferenceImages: manualRefs,
            } as any,
            status: 'queued',
            type: baseType,
            batchId: batch.id,
            characterId: itemCharacterId,
            presetId: itemPresetId,
            position: index,
          },
        })

        return contentItem
      })
    )

    if (baseType === 'video') {
      const videoQueueItems: VideoQueueItem[] = contentItems.map(ci => {
        const params = ci.generationParams as any
        return {
          contentItemId: ci.id,
          batchId: batch.id,
          prompt: ci.prompt,
          modelConfig: params as ModelConfig,
          referenceImageUrl: params?.presetImageUrl || params?.referenceImageUrl || null,
        }
      })
      await generationQueue.addManyVideos(videoQueueItems)
    } else {
      const queueItems: QueueItem[] = contentItems.map((ci) => {
        const params = ci.generationParams as any
        return {
          contentItemId: ci.id,
          batchId: batch.id,
          prompt: ci.prompt,
          negativePrompt: ci.negativePrompt || undefined,
          modelConfig: params as ModelConfig,
          presetImageUrl: params?.presetImageUrl || null,
          manualReferenceImages: params?.manualReferenceImages || null,
        }
      })
      await generationQueue.addMany(queueItems)
    }

    return NextResponse.json({
      batchId: batch.id,
      name: batch.name,
      type: batch.type,
      status: batch.status,
      totalItems: batch.totalItems,
      outputsPerCharacter,
      items: contentItems.map((ci) => ({
        id: ci.id,
        status: ci.status,
        position: ci.position,
        prompt: ci.prompt,
      })),
    })
  } catch (error) {
    console.error('[API /api/batch POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/batch — List all batches (Phase 2.4: with pagination)
export async function GET(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              prompt: true,
              status: true,
              imageUrl: true,
              videoUrl: true,
              position: true,
              type: true,
            },
          },
        },
      }),
      prisma.batch.count(),
    ])

    return NextResponse.json({
      batches,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[API /api/batch GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
