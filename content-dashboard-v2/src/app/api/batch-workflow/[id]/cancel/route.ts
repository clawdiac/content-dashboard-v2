import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

// POST /api/batch-workflow/[id]/cancel — Cancel workflow
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const workflow = await prisma.batchWorkflow.findUnique({ where: { id } })
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.batchWorkflow.update({
        where: { id },
        data: { status: 'cancelled' },
      })

      await tx.batchWorkflowQueueItem.updateMany({
        where: { workflowId: id, status: 'pending' },
        data: { status: 'cancelled' },
      })
    })

    const updated = await prisma.batchWorkflow.findUnique({
      where: { id },
      include: {
        queueItems: {
          orderBy: { position: 'asc' },
          include: { character: { select: { id: true, name: true } } },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[API /api/batch-workflow/[id]/cancel POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
