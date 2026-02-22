import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generationQueue, type QueueItem, type VideoQueueItem } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_DEFAULTS, type ModelConfig } from '@/lib/models'

// POST /api/content/[id]/regenerate — Regenerate a single content item (image or video)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const item = await prisma.contentItem.findUnique({ where: { id } })

    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    if (item.status === 'queued' || item.status === 'generating') {
      return NextResponse.json(
        { error: 'Item is already being processed', status: item.status },
        { status: 409 }
      )
    }

    let promptOverride: string | undefined
    try {
      const body = await request.json()
      promptOverride = body.prompt
    } catch {
      // No body is fine
    }

    const prompt = promptOverride || item.prompt
    const genParams = item.generationParams as any

    if (item.type === 'video') {
      await prisma.contentItem.update({
        where: { id },
        data: { status: 'queued', prompt, videoUrl: null },
      })

      if (item.batchId) {
        if (item.status === 'failed') {
          await prisma.$executeRaw`UPDATE Batch SET failed = MAX(0, failed - 1), status = 'processing' WHERE id = ${item.batchId}`
        } else if (item.status === 'generated' || item.status === 'approved') {
          await prisma.$executeRaw`UPDATE Batch SET completed = MAX(0, completed - 1), status = 'processing' WHERE id = ${item.batchId}`
        }
      }

      const modelConfig = (genParams?.model ? genParams : MODEL_DEFAULTS.seedance) as ModelConfig

      const vqi: VideoQueueItem = {
        contentItemId: id,
        batchId: item.batchId || undefined,
        prompt,
        modelConfig,
        referenceImageUrl: genParams?.presetImageUrl || genParams?.referenceImageUrl || null,
      }
      await generationQueue.addVideo(vqi)
    } else {
      await prisma.contentItem.update({
        where: { id },
        data: { status: 'queued', prompt, imageUrl: null },
      })

      if (item.batchId) {
        if (item.status === 'failed') {
          await prisma.$executeRaw`UPDATE Batch SET failed = MAX(0, failed - 1), status = 'processing' WHERE id = ${item.batchId}`
        } else if (item.status === 'generated' || item.status === 'approved') {
          await prisma.$executeRaw`UPDATE Batch SET completed = MAX(0, completed - 1), status = 'processing' WHERE id = ${item.batchId}`
        }
      }

      const modelConfig = (genParams?.model ? genParams : MODEL_DEFAULTS.nano_banana_pro) as ModelConfig

      const queueItem: QueueItem = {
        contentItemId: id,
        batchId: item.batchId || undefined,
        prompt,
        negativePrompt: item.negativePrompt || undefined,
        modelConfig,
        presetImageUrl: genParams?.presetImageUrl || null,
        manualReferenceImages: genParams?.manualReferenceImages || null,
        // Legacy fallback
        referenceImageUrl: genParams?.referenceImageUrl || null,
        referenceImages: genParams?.referenceImages || null,
      }
      await generationQueue.add(queueItem)
    }

    return NextResponse.json({
      id: item.id,
      status: 'queued',
      prompt,
      message: `${item.type === 'video' ? 'Video' : 'Item'} queued for regeneration`,
    })
  } catch (error) {
    console.error('[API /api/content/[id]/regenerate POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
