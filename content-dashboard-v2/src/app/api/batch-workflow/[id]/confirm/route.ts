import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

// POST /api/batch-workflow/[id]/confirm — Confirm workflow and start batch
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const body = await request.json()
    const { selectedPreviewId, characterIds } = body as {
      selectedPreviewId?: string
      characterIds?: string[]
    }

    if (!characterIds || !Array.isArray(characterIds) || characterIds.length === 0) {
      return NextResponse.json(
        { error: 'characterIds array is required and must not be empty' },
        { status: 400 }
      )
    }

    const workflow = await prisma.batchWorkflow.findUnique({ where: { id } })
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    let lockedSeed: number | null = null

    if (workflow.workflowType === 'seed_lock') {
      if (!selectedPreviewId) {
        return NextResponse.json(
          { error: 'selectedPreviewId is required for seed_lock workflows' },
          { status: 400 }
        )
      }

      const selectedPreview = await prisma.batchWorkflowPreview.findFirst({
        where: { id: selectedPreviewId, workflowId: id },
      })

      if (!selectedPreview) {
        return NextResponse.json(
          { error: 'Selected preview not found for this workflow' },
          { status: 400 }
        )
      }

      if (selectedPreview.seed === null || selectedPreview.seed === undefined) {
        return NextResponse.json(
          { error: 'Selected preview does not have a seed' },
          { status: 400 }
        )
      }

      lockedSeed = selectedPreview.seed
    }

    await prisma.$transaction(async (tx) => {
      if (workflow.workflowType === 'seed_lock' && selectedPreviewId) {
        await tx.batchWorkflowPreview.updateMany({
          where: { workflowId: id },
          data: { selected: false },
        })
        await tx.batchWorkflowPreview.update({
          where: { id: selectedPreviewId },
          data: { selected: true },
        })
      }

      await tx.batchWorkflow.update({
        where: { id },
        data: {
          status: 'generating',
          totalItems: characterIds.length,
          lockedSeed: lockedSeed ?? null,
        },
      })

      await Promise.all(
        characterIds.map((characterId, index) =>
          tx.batchWorkflowQueueItem.create({
            data: {
              workflowId: id,
              characterId,
              prompt: workflow.basePrompt,
              seed: lockedSeed ?? null,
              position: index,
            },
          })
        )
      )
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
    console.error('[API /api/batch-workflow/[id]/confirm POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
