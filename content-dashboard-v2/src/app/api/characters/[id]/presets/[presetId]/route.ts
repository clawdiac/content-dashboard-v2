import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; presetId: string }> }
) {
  const { error: authError, session } = await requireApiAuth()
  if (authError) return authError

  const { id, presetId } = await params

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

  const preset = await prisma.characterPreset.findFirst({
    where: { id: presetId, characterId: id },
  })
  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  await prisma.characterPreset.delete({ where: { id: presetId } })

  return NextResponse.json({ ok: true })
}
