import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

const MAX_SEED = 2147483647

// POST /api/batch-workflow/[id]/preview — Generate previews for FIRST character
export async function POST(
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
          take: 1,
          include: { character: { select: { id: true, name: true } } },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const firstQueueItem = workflow.queueItems[0]
    if (!firstQueueItem) {
      return NextResponse.json({ error: 'No characters queued in this workflow' }, { status: 400 })
    }

    const firstCharacterId = firstQueueItem.characterId

    let previewsToCreate: { seed?: number; prompt: string }[] = []

    if (workflow.workflowType === 'seed_lock') {
      // Kling: 4 previews with random seeds
      previewsToCreate = Array.from({ length: 4 }, () => ({
        seed: Math.floor(Math.random() * MAX_SEED),
        prompt: firstQueueItem.prompt,
      }))
    } else if (workflow.workflowType === 'prompt_lock') {
      // Seedance/Veo: 1 preview with the prompt
      previewsToCreate = [{ prompt: firstQueueItem.prompt }]
    } else {
      return NextResponse.json({ error: 'Invalid workflow type' }, { status: 400 })
    }

    const createdPreviews = await prisma.$transaction(async (tx) => {
      // Delete any existing previews for this workflow (regeneration)
      await tx.batchWorkflowPreview.deleteMany({
        where: { workflowId: workflow.id },
      })

      const previews = await Promise.all(
        previewsToCreate.map((preview) =>
          tx.batchWorkflowPreview.create({
            data: {
              workflowId: workflow.id,
              characterId: firstCharacterId,
              seed: preview.seed ?? null,
              prompt: preview.prompt,
              status: 'pending',
            },
            include: {
              character: { select: { id: true, name: true } },
            },
          })
        )
      )

      await tx.batchWorkflow.update({
        where: { id: workflow.id },
        data: { status: 'previewing', previewCharacterId: firstCharacterId },
      })

      return previews
    })

    return NextResponse.json({
      previews: createdPreviews,
      previewCharacter: firstQueueItem.character,
    })
  } catch (error) {
    console.error('[API /api/batch-workflow/[id]/preview POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
