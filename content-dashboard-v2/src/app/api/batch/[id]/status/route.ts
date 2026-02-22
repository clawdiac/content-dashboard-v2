import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

const FINAL_STATUSES = new Set(['completed', 'completed_with_errors', 'failed'])

// GET /api/batch/[id]/status — Lightweight batch status snapshot
export async function GET(
  _request: Request,
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
          orderBy: { position: 'asc' },
          include: {
            character: { select: { id: true, name: true } },
            preset: { select: { id: true, name: true } },
            videoPreset: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    let preset: { id: string; name: string; type: 'image' | 'video' } | null = null
    if (batch.templatePresetId) {
      const imagePreset = await prisma.characterPreset.findUnique({
        where: { id: batch.templatePresetId },
        select: { id: true, name: true },
      })
      if (imagePreset) {
        preset = { ...imagePreset, type: 'image' }
      } else {
        const videoPreset = await prisma.videoPreset.findUnique({
          where: { id: batch.templatePresetId },
          select: { id: true, name: true },
        })
        if (videoPreset) preset = { ...videoPreset, type: 'video' }
      }
    }

    const items = batch.items.map((item) => {
      const outputCount = [item.imageUrl, item.editedUrl, item.videoUrl].filter(Boolean).length
      return {
        id: item.id,
        characterName: item.character?.name || null,
        status: item.status,
        outputCount,
        etaSeconds: null,
      }
    })

    const running = batch.items.filter((i) => i.status === 'queued' || i.status === 'generating').length
    const completedAt = FINAL_STATUSES.has(batch.status) ? batch.updatedAt : null

    return NextResponse.json({
      batchId: batch.id,
      campaignName: batch.campaignName || null,
      preset,
      totalItems: batch.totalItems,
      completed: batch.completed,
      failed: batch.failed,
      running,
      status: batch.status,
      startedAt: batch.createdAt,
      completedAt,
      items,
    })
  } catch (error) {
    console.error('[API /api/batch/[id]/status GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
