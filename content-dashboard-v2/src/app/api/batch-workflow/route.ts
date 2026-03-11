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
    const { presetId, provider, characterPresetName, promptTemplate, duration, aspectRatio, resolution } = body as {
      presetId?: string
      provider?: string
      characterPresetName?: string
      promptTemplate?: string
      duration?: number
      aspectRatio?: string
      resolution?: string
    }

    if (!provider || !PROVIDERS.has(provider)) {
      return NextResponse.json(
        { error: 'provider must be one of: kling, seedance, veo' },
        { status: 400 }
      )
    }

    if (presetId) {
      // === VIDEO PRESET PATH ===

      const userPrompt = promptTemplate || ''

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
      const characterMap = new Map<string, { id: string; name: string; presetId: string; promptTemplate: string; referenceImageUrl: string | null }>()
      for (const preset of matchingPresets) {
        if (!characterMap.has(preset.characterId)) {
          characterMap.set(preset.characterId, {
            id: preset.characterId,
            name: preset.character.name,
            presetId: preset.id,
            promptTemplate: preset.promptTemplate,
            referenceImageUrl: preset.referenceImageUrl ?? null,
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
            basePrompt: userPrompt,
            aspectRatio: aspectRatio || videoPreset.aspectRatio,
            duration: duration || videoPreset.duration,
            resolution: resolution || videoPreset.resolution,
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
                prompt: userPrompt,
                referenceImageUrl: char.referenceImageUrl ?? undefined,
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

    } else if (characterPresetName) {
      // === CHARACTER PRESET PATH ===

      if (!duration || typeof duration !== 'number') {
        return NextResponse.json({ error: 'duration is required for character preset workflows' }, { status: 400 })
      }
      if (!aspectRatio || typeof aspectRatio !== 'string') {
        return NextResponse.json({ error: 'aspectRatio is required for character preset workflows' }, { status: 400 })
      }

      // Find all CharacterPresets with this name
      const matchingCharPresets = await prisma.characterPreset.findMany({
        where: { name: characterPresetName },
        include: {
          character: { select: { id: true, name: true } },
        },
      })

      if (matchingCharPresets.length === 0) {
        return NextResponse.json({ error: 'No character presets found with this name' }, { status: 400 })
      }

      // Deduplicate by characterId — keep first preset per character
      const characterMap = new Map<string, { id: string; name: string; referenceImageUrl: string }>()
      for (const preset of matchingCharPresets) {
        if (!characterMap.has(preset.characterId)) {
          characterMap.set(preset.characterId, {
            id: preset.characterId,
            name: preset.character.name,
            referenceImageUrl: preset.imageUrl,
          })
        }
      }

      const queuedCharacters = Array.from(characterMap.values())
      const workflowType = provider === 'kling' ? 'seed_lock' : 'prompt_lock'

      const workflow = await prisma.$transaction(async (tx) => {
        const wf = await tx.batchWorkflow.create({
          data: {
            name: `${characterPresetName} — ${provider}`,
            status: 'setup',
            workflowType,
            provider,
            basePrompt: promptTemplate || '',
            aspectRatio,
            duration,
            resolution: resolution || '720p',
            totalItems: queuedCharacters.length,
            videoPresetId: null,
            characterPresetName,
            previewCharacterId: queuedCharacters[0].id,
          },
        })

        await Promise.all(
          queuedCharacters.map((char, index) =>
            tx.batchWorkflowQueueItem.create({
              data: {
                workflowId: wf.id,
                characterId: char.id,
                prompt: promptTemplate || '',
                referenceImageUrl: char.referenceImageUrl,
                position: index,
              },
            })
          )
        )

        return wf
      })

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

    } else {
      return NextResponse.json({ error: 'presetId or characterPresetName required' }, { status: 400 })
    }
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
