import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

export async function GET() {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { characters: true } } },
  })

  return NextResponse.json(tags)
}

export async function POST(request: Request) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const body = await request.json()
  const { name } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
  }

  const trimmed = name.trim().toLowerCase()

  const tag = await prisma.tag.upsert({
    where: { name: trimmed },
    create: { name: trimmed },
    update: {},
  })

  return NextResponse.json(tag, { status: 201 })
}
