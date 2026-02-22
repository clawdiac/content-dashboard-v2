import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const character = await prisma.character.findUnique({
    where: { id },
    include: { presets: true },
  })

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  return NextResponse.json(character)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError2 } = await requireApiAuth('admin')
  if (authError2) return authError2

  const { id } = await params
  const body = await request.json()
  const { name, description } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const character = await prisma.character.update({
    where: { id },
    data: {
      name,
      description: description || null,
    },
  })

  return NextResponse.json(character)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError3 } = await requireApiAuth('admin')
  if (authError3) return authError3

  const { id } = await params

  await prisma.character.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
