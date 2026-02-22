import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generationQueue, type QueueItem, type VideoQueueItem } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_DEFAULTS, type ModelConfig } from '@/lib/models'

// POST /api/batch/clone — Clone a batch with same preset + characters
export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { sourceBatchId } = body

    if (!sourceBatchId || typeof sourceBatchId !== 'string') {
      return NextResponse.json({ error: 'sourceBatchId is required' }, { status: 400 })
    }

    const sourceBatch = await prisma.batch.findUnique({
      where: { id: sourceBatchId },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!sourceBatch) {
      return NextResponse.json({ error: 'Source batch not found' }, { status: 404 })
    }

    if (sourceBatch.items.length === 0) {
      return NextResponse.json({ error: 'Source batch has no items' }, { status: 400 })
    }

    const timestamp = new Date().toISOString().slice(0, 16)
    const nameBase = sourceBatch.campaignName || sourceBatch.name || 'Batch'
    const newName = `${nameBase} ${timestamp}`

    const newBatch = await prisma.batch.create({
      data: {
        name: newName,
        type: sourceBatch.type,
        status: 'processing',
        totalItems: sourceBatch.items.length,
        campaignName: sourceBatch.campaignName,
        templatePresetId: sourceBatch.templatePresetId,
        rerunnable: sourceBatch.rerunnable,
      },
    })

    const clonedItems = await Promise.all(
      sourceBatch.items.map((item, index) =>
        prisma.contentItem.create({
          data: {
            title: `${newBatch.name} #${index + 1}`,
            prompt: item.prompt,
            negativePrompt: item.negativePrompt || null,
            generator: item.generator,
            generationParams: item.generationParams || undefined,
            status: 'queued',
            type: item.type,
            batchId: newBatch.id,
            characterId: item.characterId,
            presetId: item.presetId,
            videoPresetId: item.videoPresetId,
            parentImageId: item.parentImageId,
            position: index,
          },
        })
      )
    )

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'

    const imageQueueItems: QueueItem[] = []
    const videoQueueItems: VideoQueueItem[] = []

    for (const item of clonedItems) {
      const params = item.generationParams as any

      if (item.type === 'video') {
        const modelConfig = (params?.model ? params : MODEL_DEFAULTS.seedance) as ModelConfig
        videoQueueItems.push({
          contentItemId: item.id,
          batchId: newBatch.id,
          prompt: item.prompt,
          modelConfig,
          referenceImageUrl: params?.referenceImageUrl || null,
        })
      } else {
        let refUrl = params?.referenceImageUrl || null
        if (refUrl && !refUrl.startsWith('http') && !refUrl.startsWith('data:')) {
          refUrl = `${baseUrl}${refUrl}`
        }
        const modelConfig = (params?.model ? params : MODEL_DEFAULTS.nano_banana_pro) as ModelConfig
        imageQueueItems.push({
          contentItemId: item.id,
          batchId: newBatch.id,
          prompt: item.prompt,
          negativePrompt: item.negativePrompt || undefined,
          modelConfig,
          referenceImageUrl: refUrl,
        })
      }
    }

    if (imageQueueItems.length > 0) await generationQueue.addMany(imageQueueItems)
    if (videoQueueItems.length > 0) await generationQueue.addManyVideos(videoQueueItems)

    return NextResponse.json({ newBatchId: newBatch.id, status: 'queued' })
  } catch (error) {
    console.error('[API /api/batch/clone POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
