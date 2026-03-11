import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'
import { uploadToImgBB } from '@/lib/imgbb'
import path from 'path'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth('admin')
  if (authError) return authError

  const { id } = await params
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
  if (!imageUrl.startsWith('https://i.ibb.co/')) {
    try {
      finalImageUrl = await uploadToImgBB(imgbbInput)
      console.log(`[IMGBB] Uploaded preset image: ${finalImageUrl}`)
    } catch (e) {
      console.warn(`[IMGBB] Upload failed, using original URL:`, e)
    }
  }

  const preset = await prisma.characterPreset.update({
    where: { id },
    data: {
      name,
      imageUrl: finalImageUrl,
      generationParams: generationParams || null,
    },
  })

  return NextResponse.json(preset)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError2 } = await requireApiAuth('admin')
  if (authError2) return authError2

  const { id } = await params

  await prisma.characterPreset.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
