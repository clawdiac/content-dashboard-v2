import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

export async function GET() {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const characters = await prisma.character.findMany({
    orderBy: { createdAt: 'desc' },
    include: { presets: true },
  })

  return NextResponse.json(characters)
}

export async function POST(request: Request) {
  const { error: authError2 } = await requireApiAuth('admin')
  if (authError2) return authError2

  const body = await request.json()
  const { name, description } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const character = await prisma.character.create({
    data: {
      name,
      description: description || null,
    },
  })

  return NextResponse.json(character, { status: 201 })
}
