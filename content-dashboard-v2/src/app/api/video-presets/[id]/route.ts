import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

// GET /api/video-presets/[id] — Get a single video preset
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const preset = await prisma.videoPreset.findUnique({
      where: { id },
      include: { character: true },
    })

    if (!preset) {
      return NextResponse.json({ error: 'Video preset not found' }, { status: 404 })
    }

    return NextResponse.json(preset)
  } catch (error) {
    console.error('[API /api/video-presets/[id] GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/video-presets/[id] — Update a video preset
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError2 } = await requireApiAuth('admin')
  if (authError2) return authError2

  const { id } = await params

  try {
    const body = await request.json()
    const {
      name,
      description,
      referenceImageUrl,
      promptTemplate,
      duration,
      model,
      aspectRatio,
      resolution,
      params: extraParams,
    } = body

    if (!name || !promptTemplate) {
      return NextResponse.json(
        { error: 'name and promptTemplate are required' },
        { status: 400 }
      )
    }

    const preset = await prisma.videoPreset.update({
      where: { id },
      data: {
        name,
        description: description || null,
        referenceImageUrl: referenceImageUrl || null,
        promptTemplate,
        duration: duration || 5,
        model: model || 'seedance',
        aspectRatio: aspectRatio || '9:16',
        resolution: resolution || '720p',
        params: extraParams || null,
      },
      include: { character: true },
    })

    return NextResponse.json(preset)
  } catch (error) {
    console.error('[API /api/video-presets/[id] PUT] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/video-presets/[id] — Delete a video preset
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError3 } = await requireApiAuth('admin')
  if (authError3) return authError3

  const { id } = await params

  try {
    await prisma.videoPreset.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API /api/video-presets/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
