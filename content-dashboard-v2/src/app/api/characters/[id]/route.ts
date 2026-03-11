import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

async function authorizeCharacter(characterId: string, session: any) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { presets: true, tags: true },
  })
  if (!character) {
    return {
      error: NextResponse.json({ error: 'Character not found' }, { status: 404 }),
      character: null,
    }
  }
  const isAdmin = session.user.role === 'admin'
  const isOwnerOrShared =
    character.userId === session.user.id || character.userId === null
  if (!isAdmin && !isOwnerOrShared) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      character: null,
    }
  }
  return { error: null, character }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error: authError, session } = await requireApiAuth()
  if (authError) return authError

  const { error, character } = await authorizeCharacter(id, session)
  if (error) return error

  return NextResponse.json(character)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params
  const { error } = await authorizeCharacter(id, session)
  if (error) return error

  const body = await request.json()
  const { name, description, avatarUrl, tagIds } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const character = await prisma.character.update({
    where: { id },
    data: {
      name,
      description: description || null,
      avatarUrl: avatarUrl ?? undefined,
      ...(tagIds !== undefined
        ? { tags: { set: tagIds.map((tagId: string) => ({ id: tagId })) } }
        : {}),
    },
    include: { tags: true, presets: true },
  })

  return NextResponse.json(character)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params
  const { error } = await authorizeCharacter(id, session)
  if (error) return error

  await prisma.character.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
