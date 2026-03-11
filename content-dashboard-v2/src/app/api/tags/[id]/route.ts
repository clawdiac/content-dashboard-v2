import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth('admin')
  if (authError) return authError

  const { id } = await params

  await prisma.tag.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
