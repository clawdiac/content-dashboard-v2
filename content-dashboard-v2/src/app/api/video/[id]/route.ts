import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

// GET /api/video/[id] — Get video status and details
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const item = await prisma.contentItem.findUnique({
      where: { id },
      include: {
        character: true,
        videoPreset: true,
        batch: true,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (item.type !== 'video') {
      return NextResponse.json({ error: 'Item is not a video' }, { status: 400 })
    }

    return NextResponse.json({
      id: item.id,
      status: item.status,
      prompt: item.prompt,
      videoUrl: item.videoUrl,
      imageUrl: item.imageUrl,
      generator: item.generator,
      generationParams: item.generationParams,
      character: item.character,
      videoPreset: item.videoPreset,
      batch: item.batch
        ? { id: item.batch.id, name: item.batch.name, status: item.batch.status }
        : null,
      parentImageId: item.parentImageId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })
  } catch (error) {
    console.error('[API /api/video/[id] GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
