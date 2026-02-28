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
  'pending',
]

// PATCH /api/content/status — Bulk update status for multiple content items
export async function PATCH(request: Request) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const body = await request.json()
  const { ids, status } = body as { ids: string[]; status: string }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  const result = await prisma.contentItem.updateMany({
    where: { id: { in: ids } },
    data: { status },
  })

  return NextResponse.json({ updated: result.count })
}
