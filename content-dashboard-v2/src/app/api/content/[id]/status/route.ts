import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

const VALID_STATUSES = [
  'queued',
  'generating',
  'generated',
  'failed',
  'approved',
  'in_editing',
  'done',
  'rejected',
  'posted',
]

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params
  const body = await request.json()
  const { status, assignedToId } = body

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const data: Record<string, string> = { status }
  if (status === 'in_editing' && assignedToId) {
    data.assignedToId = assignedToId
  }

  const item = await prisma.contentItem.update({
    where: { id },
    data,
    include: { assignedTo: true },
  })

  return NextResponse.json(item)
}
