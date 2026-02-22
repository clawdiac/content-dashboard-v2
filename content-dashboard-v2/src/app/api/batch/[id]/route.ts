import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generationQueue } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'

// GET /api/batch/[id] — Batch status + all items
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const batch = await prisma.batch.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        totalItems: true,
        completed: true,
        failed: true,
        campaignName: true,
        templatePresetId: true,
        rerunnable: true,
        createdAt: true,
        items: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            prompt: true,
            negativePrompt: true,
            status: true,
            imageUrl: true,
            videoUrl: true,
            position: true,
            type: true,
            character: { select: { id: true, name: true } },
            preset: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    const queueStatus = generationQueue.getStatus()

    return NextResponse.json({
      ...batch,
      queue: queueStatus,
    })
  } catch (error) {
    console.error('[API /api/batch/[id] GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/batch/[id] — Remove batch and its items
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const batch = await prisma.batch.findUnique({ where: { id } })
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    await prisma.contentItem.deleteMany({ where: { batchId: id } })
    await prisma.batch.delete({ where: { id } })

    return NextResponse.json({ ok: true, batchId: id })
  } catch (error) {
    console.error('[API /api/batch/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
