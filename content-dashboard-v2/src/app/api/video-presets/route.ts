import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

// GET /api/video-presets — List all video presets
export async function GET() {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const presets = await prisma.videoPreset.findMany({
      orderBy: { createdAt: 'desc' },
      include: { character: true },
    })
    return NextResponse.json(presets)
  } catch (error) {
    console.error('[API /api/video-presets GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/video-presets — Create a new video preset
export async function POST(request: NextRequest) {
  const { error: authError2 } = await requireApiAuth('admin')
  if (authError2) return authError2

  try {
    const body = await request.json()
    const {
      name,
      description,
      referenceImageUrl,
      characterId,
      promptTemplate,
      duration = 5,
      model = 'seedance',
      aspectRatio = '9:16',
      resolution = '720p',
      params,
    } = body

    if (!name || !characterId || !promptTemplate) {
      return NextResponse.json(
        { error: 'name, characterId, and promptTemplate are required' },
        { status: 400 }
      )
    }

    // Verify character exists
    const character = await prisma.character.findUnique({ where: { id: characterId } })
    if (!character) {
      return NextResponse.json(
        { error: `Character with id ${characterId} not found` },
        { status: 404 }
      )
    }

    const preset = await prisma.videoPreset.create({
      data: {
        name,
        description: description || null,
        referenceImageUrl: referenceImageUrl || null,
        characterId,
        promptTemplate,
        duration,
        model,
        aspectRatio,
        resolution,
        params: params || null,
      },
      include: { character: true },
    })

    return NextResponse.json(preset)
  } catch (error) {
    console.error('[API /api/video-presets POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
