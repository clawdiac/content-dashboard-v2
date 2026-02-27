import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'

const PROVIDERS = new Set(['kling', 'seedance', 'veo'])

// POST /api/batch-workflow — Create a new batch workflow from a video preset
export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { presetId, provider } = body as {
      presetId?: string
      provider?: string
    }

    if (!presetId || typeof presetId !== 'string') {
      return NextResponse.json({ error: 'presetId is required' }, { status: 400 })
    }

    if (!provider || !PROVIDERS.has(provider)) {
      return NextResponse.json(
        { error: 'provider must be one of: kling, seedance, veo' },
        { status: 400 }
      )
    }

    // Look up the selected video preset
    const videoPreset = await prisma.videoPreset.findUnique({
      where: { id: presetId },
      include: { character: true },
    })

    if (!videoPreset) {
      return NextResponse.json({ error: 'Video preset not found' }, { status: 404 })
    }

    // Find ALL characters that have a VideoPreset with the SAME NAME
    const matchingPresets = await prisma.videoPreset.findMany({
      where: { name: videoPreset.name },
      include: {
        character: { select: { id: true, name: true, description: true } },
      },
    })

    // Deduplicate characters (a character might have multiple presets with same name)
    const characterMap = new Map<string, { id: string; name: string; presetId: string; promptTemplate: string }>()
    for (const preset of matchingPresets) {
      if (!characterMap.has(preset.characterId)) {
        characterMap.set(preset.characterId, {
          id: preset.characterId,
          name: preset.character.name,
          presetId: preset.id,
          promptTemplate: preset.promptTemplate,
        })
      }
    }

    const queuedCharacters = Array.from(characterMap.values())

    if (queuedCharacters.length === 0) {
      return NextResponse.json({ error: 'No characters found with this preset' }, { status: 400 })
    }

    const workflowType = provider === 'kling' ? 'seed_lock' : 'prompt_lock'

    // Create workflow + queue items in transaction
    const workflow = await prisma.$transaction(async (tx) => {
      const wf = await tx.batchWorkflow.create({
        data: {
          name: `${videoPreset.name} — ${provider}`,
          status: 'setup',
          workflowType,
          provider,
          basePrompt: videoPreset.promptTemplate,
          aspectRatio: videoPreset.aspectRatio,
          duration: videoPreset.duration,
          resolution: videoPreset.resolution,
          totalItems: queuedCharacters.length,
          videoPresetId: videoPreset.id,
          previewCharacterId: queuedCharacters[0].id,
          params: videoPreset.params ?? undefined,
        },
      })

      // Create queue items for all characters
      await Promise.all(
        queuedCharacters.map((char, index) =>
          tx.batchWorkflowQueueItem.create({
            data: {
              workflowId: wf.id,
              characterId: char.id,
              prompt: char.promptTemplate,
              position: index,
            },
          })
        )
      )

      return wf
    })

    // Fetch full workflow with queue items
    const fullWorkflow = await prisma.batchWorkflow.findUnique({
      where: { id: workflow.id },
      include: {
        videoPreset: true,
        previewCharacter: { select: { id: true, name: true } },
        queueItems: {
          orderBy: { position: 'asc' },
          include: { character: { select: { id: true, name: true } } },
        },
      },
    })

    return NextResponse.json({
      ...fullWorkflow,
      queuedCharacters: queuedCharacters.map((c) => ({ id: c.id, name: c.name })),
    })
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
        videoPreset: { select: { id: true, name: true } },
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
