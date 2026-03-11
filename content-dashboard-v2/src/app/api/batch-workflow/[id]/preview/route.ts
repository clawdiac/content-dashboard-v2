import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { mkdir } from 'fs/promises'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_DEFAULTS, type SeedanceConfig, type KlingConfig, type ModelConfig } from '@/lib/models'
import { generateWithSeedanceBatch } from '@/lib/providers/seedance-batch'
import { generateWithKlingBatch } from '@/lib/providers/kling-batch'
import { uploadToImgBB } from '@/lib/imgbb'
import { uploadVideoToCloudinary } from '@/lib/cloudinary'

const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated')
const VIDEO_DIR = path.join(GENERATED_DIR, 'videos')

async function downloadVideoLocally(videoUrl: string, filenamePrefix: string): Promise<string> {
  await mkdir(VIDEO_DIR, { recursive: true })
  const safePrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safePrefix}_${Date.now()}.mp4`
  const filepath = path.join(VIDEO_DIR, filename)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 300_000) // 5 minutes

  try {
    const response = await fetch(videoUrl, { signal: controller.signal })
    if (!response.ok) {
      clearTimeout(timeout)
      console.error(`[Preview Gen] Failed to download video: ${response.status}`)
      return videoUrl
    }
    if (!response.body) {
      clearTimeout(timeout)
      return videoUrl
    }
    const writeStream = fs.createWriteStream(filepath)
    await pipeline(
      Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
      writeStream
    )
    clearTimeout(timeout)
    console.log(`[Preview Gen] Downloaded video locally: /generated/videos/${filename}`)
    return `/generated/videos/${filename}`
  } catch (error) {
    clearTimeout(timeout)
    console.error('[Preview Gen] Failed to download video, using remote URL:', error)
    return videoUrl
  }
}

const MAX_SEED = 2147483647

function buildGenerationConfig(workflow: {
  provider: string
  aspectRatio: string
  duration: number
  resolution: string
  params: unknown
}): ModelConfig {
  if (workflow.provider === 'seedance') {
    const base = MODEL_DEFAULTS.seedance as SeedanceConfig
    return {
      ...base,
      duration: String(workflow.duration) as SeedanceConfig['duration'],
      aspect_ratio: workflow.aspectRatio as SeedanceConfig['aspect_ratio'],
      resolution: workflow.resolution as SeedanceConfig['resolution'],
      ...((workflow.params as Record<string, unknown>) || {}),
    } as SeedanceConfig
  } else {
    // kling
    const base = MODEL_DEFAULTS.kling as KlingConfig
    return {
      ...base,
      duration: String(workflow.duration) as KlingConfig['duration'],
      aspect_ratio: workflow.aspectRatio as KlingConfig['aspect_ratio'],
      ...((workflow.params as Record<string, unknown>) || {}),
    } as KlingConfig
  }
}

async function generatePreviewInBackground(
  previewId: string,
  prompt: string,
  config: ModelConfig,
  referenceImageUrl: string | null,
  seed: number | null,
  workflowId: string
): Promise<void> {
  try {
    // Mark as generating
    await prisma.batchWorkflowPreview.update({
      where: { id: previewId },
      data: { status: 'generating' },
    })

    // Resolve local reference image to public URL via ImgBB
    let resolvedImageUrl = referenceImageUrl
    if (referenceImageUrl && !referenceImageUrl.startsWith('https://')) {
      try {
        const imagePath = referenceImageUrl.startsWith('/')
          ? path.join(process.cwd(), 'public', referenceImageUrl)
          : referenceImageUrl
        resolvedImageUrl = await uploadToImgBB(imagePath)
        console.log(`[Preview Gen] Uploaded reference image to ImgBB: ${resolvedImageUrl}`)
      } catch (err) {
        console.error(`[Preview Gen] Failed to upload reference image to ImgBB:`, err)
        resolvedImageUrl = null
      }
    }

    let result
    if (config.model === 'seedance') {
      const seedanceConfig = { ...config, seed } as SeedanceConfig
      result = await generateWithSeedanceBatch(prompt, seedanceConfig, resolvedImageUrl)
    } else {
      result = await generateWithKlingBatch(prompt, config as KlingConfig, resolvedImageUrl)
    }

    if (result.success && result.videoUrl) {
      // Try Cloudinary re-upload first (fast EU CDN)
      let finalUrl = result.videoUrl
      try {
        const cloudinaryUrl = await uploadVideoToCloudinary(result.videoUrl)
        if (cloudinaryUrl !== result.videoUrl) {
          finalUrl = cloudinaryUrl
          console.log('[Preview Gen] Re-uploaded to Cloudinary:', cloudinaryUrl)
        }
      } catch (err) {
        console.error('[Preview Gen] Cloudinary upload failed, using original URL:', err)
      }

      await prisma.batchWorkflowPreview.update({
        where: { id: previewId },
        data: { status: 'completed', videoUrl: finalUrl },
      })

      // If Cloudinary wasn't available, try local download as non-blocking fallback
      if (finalUrl === result.videoUrl) {
        downloadVideoLocally(result.videoUrl, `preview_${previewId}`)
          .then(async (localUrl) => {
            if (localUrl !== result.videoUrl) {
              await prisma.batchWorkflowPreview.update({
                where: { id: previewId },
                data: { videoUrl: localUrl },
              })
            }
          })
          .catch(console.error)
      }
    } else {
      await prisma.batchWorkflowPreview.update({
        where: { id: previewId },
        data: {
          status: 'failed',
          error: result.error || 'Generation failed',
        },
      })
    }
  } catch (error) {
    console.error(`[Preview Gen] Failed for preview ${previewId}:`, error)
    await prisma.batchWorkflowPreview.update({
      where: { id: previewId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown generation error',
      },
    }).catch(() => {}) // Don't throw if cleanup fails
  }

  // Check if ALL previews for this workflow are done (completed or failed)
  const remaining = await prisma.batchWorkflowPreview.count({
    where: {
      workflowId,
      status: { in: ['pending', 'generating'] },
    },
  })

  if (remaining === 0) {
    console.log(`[Preview Gen] All previews done for workflow ${workflowId}`)
  }
}

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

    let body: { prompt?: string } = {}
    try { body = await _request.json() } catch { /* no body is fine */ }
    const promptOverride = body.prompt?.trim() || null

    const firstQueueItem = workflow.queueItems[0]
    if (!firstQueueItem) {
      return NextResponse.json({ error: 'No characters queued in this workflow' }, { status: 400 })
    }

    const firstCharacterId = firstQueueItem.characterId
    const effectivePrompt = promptOverride || firstQueueItem.prompt

    // If prompt changed, update the queue items and workflow basePrompt
    if (promptOverride) {
      await prisma.batchWorkflowQueueItem.updateMany({
        where: { workflowId: workflow.id },
        data: { prompt: promptOverride },
      })
      await prisma.batchWorkflow.update({
        where: { id: workflow.id },
        data: { basePrompt: promptOverride },
      })
    }

    let previewsToCreate: { seed?: number; prompt: string }[] = []

    if (workflow.workflowType === 'seed_lock') {
      // Kling: 4 previews with random seeds
      previewsToCreate = Array.from({ length: 4 }, () => ({
        seed: Math.floor(Math.random() * MAX_SEED),
        prompt: effectivePrompt,
      }))
    } else if (workflow.workflowType === 'prompt_lock') {
      // Seedance/Veo: 1 preview with the prompt
      previewsToCreate = [{ prompt: effectivePrompt }]
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

    // Fire-and-forget: generate videos in the background
    const config = buildGenerationConfig(workflow)
    const referenceImageUrl = firstQueueItem.referenceImageUrl ?? null

    // Don't await — let it run in the background
    for (const preview of createdPreviews) {
      generatePreviewInBackground(
        preview.id,
        preview.prompt,
        config,
        referenceImageUrl,
        preview.seed,
        workflow.id
      ).catch((err) => console.error(`[Preview Gen] Unhandled error for ${preview.id}:`, err))
    }

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
