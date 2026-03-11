import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'
import { batchWorkflowQueue } from '@/lib/batch-queue'

// POST /api/batch-workflow/[id]/confirm — Lock seed/prompt and start batch generation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  try {
    const body = await request.json()
    const { approvedPreviewId, confirmedPrompt } = body as {
      approvedPreviewId?: string
      confirmedPrompt?: string
    }

    const workflow = await prisma.batchWorkflow.findUnique({
      where: { id },
      include: {
        queueItems: { orderBy: { position: 'asc' } },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    if (workflow.queueItems.length === 0) {
      return NextResponse.json({ error: 'No characters queued' }, { status: 400 })
    }

    let lockedSeed: number | null = null
    let lockedPrompt: string | null = null

    if (workflow.workflowType === 'seed_lock') {
      // Kling: require approved preview to lock seed
      if (!approvedPreviewId) {
        return NextResponse.json(
          { error: 'approvedPreviewId is required for seed_lock workflows' },
          { status: 400 }
        )
      }

      const selectedPreview = await prisma.batchWorkflowPreview.findFirst({
        where: { id: approvedPreviewId, workflowId: id },
      })

      if (!selectedPreview) {
        return NextResponse.json({ error: 'Preview not found' }, { status: 404 })
      }

      if (selectedPreview.seed === null) {
        return NextResponse.json({ error: 'Selected preview has no seed' }, { status: 400 })
      }

      lockedSeed = selectedPreview.seed
    } else if (workflow.workflowType === 'prompt_lock') {
      // Seedance/Veo: require confirmed prompt
      if (!confirmedPrompt || typeof confirmedPrompt !== 'string' || !confirmedPrompt.trim()) {
        return NextResponse.json(
          { error: 'confirmedPrompt is required for prompt_lock workflows' },
          { status: 400 }
        )
      }
      lockedPrompt = confirmedPrompt.trim()
    }

    await prisma.$transaction(async (tx) => {
      // Mark the approved preview
      if (approvedPreviewId) {
        await tx.batchWorkflowPreview.updateMany({
          where: { workflowId: id },
          data: { selected: false },
        })
        await tx.batchWorkflowPreview.update({
          where: { id: approvedPreviewId },
          data: { selected: true },
        })
      }

      // Update workflow status
      await tx.batchWorkflow.update({
        where: { id },
        data: {
          status: 'generating',
          lockedSeed,
          lockedPrompt,
        },
      })

      // Update all queue items with locked seed or prompt
      if (lockedSeed !== null) {
        await tx.batchWorkflowQueueItem.updateMany({
          where: { workflowId: id },
          data: { seed: lockedSeed },
        })
      }

      if (lockedPrompt !== null) {
        await tx.batchWorkflowQueueItem.updateMany({
          where: { workflowId: id },
          data: { prompt: lockedPrompt },
        })
      }
    })

    // Fire-and-forget: start processing the batch queue
    batchWorkflowQueue.startWorkflow(id).catch((err) => {
      console.error(`[BatchQueue] Failed to start workflow ${id}:`, err)
    })

    // Return updated workflow
    const updated = await prisma.batchWorkflow.findUnique({
      where: { id },
      include: {
        videoPreset: { select: { id: true, name: true } },
        previewCharacter: { select: { id: true, name: true } },
        previews: {
          orderBy: { createdAt: 'desc' },
          include: { character: { select: { id: true, name: true } } },
        },
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
