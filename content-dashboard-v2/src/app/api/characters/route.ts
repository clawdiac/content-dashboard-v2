import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

export async function GET(request: Request) {
  const { error: authError, session } = await requireApiAuth()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const tagFilter = searchParams.get('tag')

  const isAdmin = session!.user.role === 'admin'

  const where: any = {}
  if (!isAdmin) {
    where.OR = [{ userId: session!.user.id }, { userId: null }]
  }
  if (tagFilter) {
    where.tags = { some: { name: tagFilter } }
  }

  const characters = await prisma.character.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      presets: true,
      tags: true,
      _count: { select: { presets: true } },
    },
  })

  return NextResponse.json(characters)
}

export async function POST(request: Request) {
  const { error: authError, session } = await requireApiAuth()
  if (authError) return authError

  const body = await request.json()
  const { name, description, avatarUrl, tagIds } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const character = await prisma.character.create({
    data: {
      name,
      description: description || null,
      avatarUrl: avatarUrl || null,
      userId: session!.user.id,
      ...(tagIds?.length
        ? { tags: { connect: tagIds.map((id: string) => ({ id })) } }
        : {}),
    },
    include: { tags: true, presets: true },
  })

  return NextResponse.json(character, { status: 201 })
}
