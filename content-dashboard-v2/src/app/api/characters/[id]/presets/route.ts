import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'
import { uploadToImgBB } from '@/lib/imgbb'
import path from 'path'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  const character = await prisma.character.findUnique({ where: { id } })
  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }
  const isAdmin = session!.user.role === 'admin'
  const isOwnerOrShared =
    character.userId === session!.user.id || character.userId === null
  if (!isAdmin && !isOwnerOrShared) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, imageUrl, generationParams } = body

  if (!name || !imageUrl) {
    return NextResponse.json(
      { error: 'Name and imageUrl are required' },
      { status: 400 }
    )
  }

  // Resolve relative paths to absolute filesystem paths
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
      characterId: id,
      generationParams: generationParams || null,
    },
  })

  return NextResponse.json(preset)
}
