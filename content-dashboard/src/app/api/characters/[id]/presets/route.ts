import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, imageUrl, generationParams } = body

  if (!name || !imageUrl) {
    return NextResponse.json(
      { error: 'Name and imageUrl are required' },
      { status: 400 }
    )
  }

  const preset = await prisma.characterPreset.create({
    data: {
      name,
      imageUrl,
      characterId: id,
      generationParams: generationParams || null,
    },
  })

  return NextResponse.json(preset)
}
