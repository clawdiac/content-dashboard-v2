import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { analyzeCharacterFromBase64 } from '@/lib/character-analyzer'

export async function POST(request: Request) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  try {
    const characterJson = await analyzeCharacterFromBase64(base64, mimeType)
    return NextResponse.json(characterJson)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed'
    console.error('[analyze] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
