import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

const WORKFLOW_TYPES = new Set(['seed_lock', 'prompt_lock'])
const PROVIDERS = new Set(['kling', 'seedance', 'veo'])

// POST /api/batch-workflow — Create a new batch workflow
export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      name,
      workflowType,
      provider,
      basePrompt,
      aspectRatio,
      duration,
      resolution,
      params,
    } = body as {
      name?: string
      workflowType?: string
      provider?: string
      basePrompt?: string
      aspectRatio?: string
      duration?: number
      resolution?: string
      params?: unknown
    }

    if (!workflowType || !WORKFLOW_TYPES.has(workflowType)) {
      return NextResponse.json(
        { error: 'workflowType must be one of: seed_lock, prompt_lock' },
        { status: 400 }
      )
    }

    if (!provider || !PROVIDERS.has(provider)) {
      return NextResponse.json(
        { error: 'provider must be one of: kling, seedance, veo' },
        { status: 400 }
      )
    }

    if (!basePrompt || typeof basePrompt !== 'string' || !basePrompt.trim()) {
      return NextResponse.json({ error: 'basePrompt is required' }, { status: 400 })
    }

    if (duration !== undefined && (typeof duration !== 'number' || !Number.isFinite(duration))) {
      return NextResponse.json({ error: 'duration must be a number' }, { status: 400 })
    }

    const workflow = await prisma.batchWorkflow.create({
      data: {
        name: name || null,
        status: 'setup',
        workflowType,
        provider,
        basePrompt: basePrompt.trim(),
        aspectRatio: aspectRatio || undefined,
        duration: duration ?? undefined,
        resolution: resolution || undefined,
        params: params ?? undefined,
      },
    })

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('[API /api/batch-workflow POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/batch-workflow — List all batch workflows
export async function GET() {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const workflows = await prisma.batchWorkflow.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { previews: true, queueItems: true },
        },
      },
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('[API /api/batch-workflow GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
