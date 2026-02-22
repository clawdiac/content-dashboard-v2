import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireApiAuth } from '@/lib/api-auth'
import { randomUUID } from 'crypto'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

export async function POST(request: Request) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG and PNG files are allowed' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'references')
  await mkdir(uploadsDir, { recursive: true })

  const id = randomUUID()
  const ext = file.type === 'image/png' ? '.png' : '.jpg'
  const filename = `${id}${ext}`
  const filepath = path.join(uploadsDir, filename)

  const bytes = await file.arrayBuffer()
  await writeFile(filepath, Buffer.from(bytes))

  const url = `/uploads/references/${filename}`

  return NextResponse.json({ 
    id, 
    url, 
    size: file.size, 
    mimeType: file.type,
    originalFilename: file.name 
  })
}
