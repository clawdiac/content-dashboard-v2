import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

// GET /api/batch-workflow/[id] — Fetch workflow with previews and queue items
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
        previews: {
          orderBy: { createdAt: 'desc' },
          include: {
            character: { select: { id: true, name: true } },
          },
        },
        queueItems: {
          orderBy: { position: 'asc' },
          include: {
            character: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('[API /api/batch-workflow/[id] GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/batch-workflow/[id] — Delete workflow and related data
export async function DELETE(
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

    await prisma.batchWorkflow.delete({ where: { id } })

    return NextResponse.json({ ok: true, workflowId: id })
  } catch (error) {
    console.error('[API /api/batch-workflow/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
