import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireApiAuth } from '@/lib/api-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${id}-${timestamp}-${safeName}`
  const filepath = path.join(uploadsDir, filename)

  const bytes = await file.arrayBuffer()
  await writeFile(filepath, Buffer.from(bytes))

  const editedUrl = `/uploads/${filename}`

  const item = await prisma.contentItem.update({
    where: { id },
    data: { editedUrl },
    include: { assignedTo: true },
  })

  return NextResponse.json(item)
}
