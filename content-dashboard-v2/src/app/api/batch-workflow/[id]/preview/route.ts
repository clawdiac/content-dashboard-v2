import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

const MAX_SEED = 2147483647

// POST /api/batch-workflow/[id]/preview — Generate previews
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

    let previewsToCreate: { seed?: number; prompt: string }[] = []

    if (workflow.workflowType === 'seed_lock') {
      previewsToCreate = Array.from({ length: 4 }, () => ({
        seed: Math.floor(Math.random() * MAX_SEED),
        prompt: workflow.basePrompt,
      }))
    } else if (workflow.workflowType === 'prompt_lock') {
      previewsToCreate = [{ prompt: workflow.basePrompt }]
    } else {
      return NextResponse.json({ error: 'Invalid workflow type' }, { status: 400 })
    }

    const createdPreviews = await prisma.$transaction(async (tx) => {
      const previews = await Promise.all(
        previewsToCreate.map((preview) =>
          tx.batchWorkflowPreview.create({
            data: {
              workflowId: workflow.id,
              seed: preview.seed ?? null,
              prompt: preview.prompt,
              status: 'pending',
            },
          })
        )
      )

      await tx.batchWorkflow.update({
        where: { id: workflow.id },
        data: { status: 'previewing' },
      })

      return previews
    })

    return NextResponse.json(createdPreviews)
  } catch (error) {
    console.error('[API /api/batch-workflow/[id]/preview POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
