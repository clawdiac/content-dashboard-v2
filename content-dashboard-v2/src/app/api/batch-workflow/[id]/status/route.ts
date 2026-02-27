import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

// GET /api/batch-workflow/[id]/status — Workflow status snapshot
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const workflow = await prisma.batchWorkflow.findUnique({
      where: { id },
      include: {
        queueItems: {
          orderBy: { position: 'asc' },
          include: { character: { select: { id: true, name: true } } },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: workflow.id,
      status: workflow.status,
      totalItems: workflow.totalItems,
      completedItems: workflow.completedItems,
      failedItems: workflow.failedItems,
      queueItems: workflow.queueItems.map((item) => ({
        id: item.id,
        status: item.status,
        position: item.position,
        character: item.character,
      })),
    })
  } catch (error) {
    console.error('[API /api/batch-workflow/[id]/status GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
