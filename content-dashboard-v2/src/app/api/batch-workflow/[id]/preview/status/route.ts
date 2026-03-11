import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

// GET /api/batch-workflow/[id]/preview/status — Poll preview generation progress
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const previews = await prisma.batchWorkflowPreview.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        character: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ previews })
  } catch (error) {
    console.error('[API preview/status GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
