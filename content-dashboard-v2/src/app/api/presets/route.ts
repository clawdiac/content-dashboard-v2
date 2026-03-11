import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'
import { uploadToImgBB } from '@/lib/imgbb'
import path from 'path'

// GET /api/presets — List all presets (optionally filter by characterId)
export async function GET(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const characterId = searchParams.get('characterId')

  const where = characterId ? { characterId } : {}

  const presets = await prisma.characterPreset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { character: true },
  })

  return NextResponse.json(presets)
}

// POST /api/presets — Create a new character preset
export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { characterId, name, imageUrl, generationParams } = body

    if (!characterId) {
      return NextResponse.json({ error: 'characterId is required' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    // Validate character exists
    const character = await prisma.character.findUnique({ where: { id: characterId } })
    if (!character) {
      return NextResponse.json({ error: `Character not found: ${characterId}` }, { status: 404 })
    }

    // Resolve relative paths (e.g. /characters/sofia.jpg) to absolute filesystem paths
    let imgbbInput = imageUrl
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
      imgbbInput = path.join(process.cwd(), 'public', imageUrl)
    }

    let finalImageUrl = imageUrl
    try {
      finalImageUrl = await uploadToImgBB(imgbbInput)
      console.log(`[IMGBB] Uploaded preset image: ${finalImageUrl}`)
    } catch (e) {
      console.warn(`[IMGBB] Upload failed, using original URL:`, e)
    }

    const preset = await prisma.characterPreset.create({
      data: {
        name,
        imageUrl: finalImageUrl,
        characterId,
        generationParams: generationParams || null,
      },
    })

    return NextResponse.json({
      id: preset.id,
      characterId: preset.characterId,
      name: preset.name,
      imageUrl: preset.imageUrl,
      generationParams: preset.generationParams,
      createdAt: preset.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('[API /api/presets POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
