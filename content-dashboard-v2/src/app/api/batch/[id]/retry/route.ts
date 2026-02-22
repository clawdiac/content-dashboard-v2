import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generationQueue, type QueueItem, type VideoQueueItem } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_DEFAULTS, type ModelConfig } from '@/lib/models'

// POST /api/batch/[id]/retry — Retry all failed items in a batch
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        items: {
          where: { status: 'failed' },
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    if (batch.items.length === 0) {
      return NextResponse.json({ message: 'No failed items to retry', retried: 0 })
    }

    await prisma.$executeRaw`UPDATE Batch SET failed = MAX(0, failed - ${batch.items.length}), status = 'processing' WHERE id = ${id}`

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'

    for (const item of batch.items) {
      await prisma.contentItem.update({
        where: { id: item.id },
        data: { status: 'queued' },
      })
    }

    if (batch.type === 'video') {
      const videoItems: VideoQueueItem[] = batch.items.map(item => {
        const genParams = item.generationParams as any
        const modelConfig = (genParams?.model ? genParams : MODEL_DEFAULTS.seedance) as ModelConfig
        return {
          contentItemId: item.id,
          batchId: batch.id,
          prompt: item.prompt,
          modelConfig,
          referenceImageUrl: genParams?.referenceImageUrl || null,
        }
      })
      await generationQueue.addManyVideos(videoItems)
    } else {
      const queueItems: QueueItem[] = batch.items.map(item => {
        const genParams = item.generationParams as any
        let refUrl = genParams?.referenceImageUrl || null
        if (refUrl && !refUrl.startsWith('http') && !refUrl.startsWith('data:')) {
          refUrl = `${baseUrl}${refUrl}`
        }
        const modelConfig = (genParams?.model ? genParams : MODEL_DEFAULTS.nano_banana_pro) as ModelConfig
        return {
          contentItemId: item.id,
          batchId: batch.id,
          prompt: item.prompt,
          negativePrompt: item.negativePrompt || undefined,
          modelConfig,
          referenceImageUrl: refUrl,
        }
      })
      await generationQueue.addMany(queueItems)
    }

    return NextResponse.json({
      message: `Retrying ${batch.items.length} failed items`,
      retried: batch.items.length,
      batchId: id,
    })
  } catch (error) {
    console.error('[API /api/batch/[id]/retry POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
