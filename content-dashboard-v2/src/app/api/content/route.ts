import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generationQueue, type QueueItem } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_REGISTRY } from '@/lib/models'
import { validateModelConfig } from '@/lib/models/validator'

export async function GET() {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const items = await prisma.contentItem.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignedTo: true,
      batch: { select: { id: true, name: true } },
      character: { select: { id: true, name: true } },
      preset: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const { error: authError2 } = await requireApiAuth()
  if (authError2) return authError2

  const body = await request.json()
  const { title, prompt, negativePrompt, modelConfig, presetImageUrl, referenceImages, characterId, presetId } = body

  console.log('[API /api/content POST] Received:', {
    prompt: prompt?.slice(0, 50),
    presetId,
    presetImageUrl: presetImageUrl?.slice(0, 80),
    referenceImagesCount: referenceImages?.length || 0,
    modelConfig: modelConfig?.model,
  })

  if (!prompt) {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    )
  }

  if (!modelConfig) {
    return NextResponse.json(
      { error: 'modelConfig is required' },
      { status: 400 }
    )
  }

  const validation = validateModelConfig(modelConfig)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors.join('; ') }, { status: 400 })
  }

  const modelSpec = MODEL_REGISTRY[modelConfig.model as keyof typeof MODEL_REGISTRY]

  // Resolve preset image: use explicit presetImageUrl, or fall back to preset DB lookup
  let resolvedPresetImageUrl = presetImageUrl || null
  let resolvedCharacterId = characterId || null
  let resolvedPresetId = presetId || null

  if (resolvedPresetId && !resolvedPresetImageUrl) {
    const preset = await prisma.characterPreset.findUnique({
      where: { id: resolvedPresetId },
    })
    if (preset) {
      resolvedPresetImageUrl = preset.imageUrl
      if (!resolvedCharacterId) {
        resolvedCharacterId = preset.characterId
      }
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
console.log('[API /api/content] Computing baseUrl: NEXTAUTH_URL=', process.env.NEXTAUTH_URL, 'fallback=http://localhost:3000, final baseUrl=', baseUrl)

  // Resolve preset image URL to absolute
  if (resolvedPresetImageUrl && !resolvedPresetImageUrl.startsWith('http') && !resolvedPresetImageUrl.startsWith('data:')) {
    resolvedPresetImageUrl = `${baseUrl}${resolvedPresetImageUrl}`
  }

  // Resolve manual reference images to absolute URLs
  let resolvedManualRefs: string[] | null = null
  if (referenceImages && referenceImages.length > 0) {
    resolvedManualRefs = referenceImages.map((img: any) => {
      const url = typeof img === 'string' ? img : img?.url
      if (url && !url.startsWith('http') && !url.startsWith('data:')) {
        return `${baseUrl}${url}`
      }
      return url
    }).filter(Boolean)
  }

  const itemTitle = title || `Generation ${new Date().toISOString().slice(0, 16)}`

  const item = await prisma.contentItem.create({
    data: {
      title: itemTitle,
      prompt,
      negativePrompt: negativePrompt || null,
      generator: modelConfig.model,
      generationParams: {
        ...modelConfig,
        presetImageUrl: resolvedPresetImageUrl,
        manualReferenceImages: resolvedManualRefs,
      } as any,
      status: 'queued',
      type: modelSpec.type,
      characterId: resolvedCharacterId,
      presetId: resolvedPresetId,
    },
  })

  console.log('[API /api/content POST] Created item:', item.id, 'presetImage:', resolvedPresetImageUrl?.slice(0, 80), 'manualRefs:', resolvedManualRefs?.length || 0)

  const queueItem: QueueItem = {
    contentItemId: item.id,
    prompt: item.prompt,
    negativePrompt: item.negativePrompt || undefined,
    modelConfig: item.generationParams as any,
    presetImageUrl: resolvedPresetImageUrl,
    manualReferenceImages: resolvedManualRefs,
  }

  await generationQueue.add(queueItem)

  return NextResponse.json({
    ...item,
    status: 'queued',
    message: 'Item queued for generation',
  })
}
