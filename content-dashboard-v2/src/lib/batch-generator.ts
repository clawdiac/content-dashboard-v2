import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import type { BatchWorkflow, BatchWorkflowPreview, BatchWorkflowQueueItem } from '@prisma/client'
import type { SeedanceConfig, KlingConfig } from '@/lib/models/types'
import { prisma } from '@/lib/prisma'
import { generateBatchVideo, type BatchProviderResult, type BatchProvider } from '@/lib/providers'
import { uploadToImgBB } from '@/lib/imgbb'
import { uploadVideoToCloudinary } from '@/lib/cloudinary'

const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated')
const VIDEO_DIR = path.join(GENERATED_DIR, 'videos')
let videoDirReady = false

async function ensureVideoDir() {
  if (videoDirReady) return
  await mkdir(VIDEO_DIR, { recursive: true })
  videoDirReady = true
}

function coerceDuration(value: number | string | null | undefined): '5' | '10' {
  const str = String(value ?? '5')
  return str === '10' ? '10' : '5'
}

function buildSeedanceConfig(
  workflow: BatchWorkflow,
  seedOverride?: number | null
): SeedanceConfig {
  const params = (workflow.params ?? {}) as Partial<SeedanceConfig>

  const config: SeedanceConfig = {
    model: 'seedance',
    resolution: (params.resolution ?? workflow.resolution ?? '720p') as SeedanceConfig['resolution'],
    duration: coerceDuration(params.duration ?? workflow.duration),
    aspect_ratio: (params.aspect_ratio ?? workflow.aspectRatio ?? '9:16') as SeedanceConfig['aspect_ratio'],
    watermark: params.watermark ?? false,
    generate_audio: params.generate_audio ?? true,
    seed: params.seed ?? null,
    camerafixed: params.camerafixed ?? false,
  }

  if (seedOverride !== undefined) {
    config.seed = seedOverride
  }

  return config
}

function buildKlingConfig(workflow: BatchWorkflow): KlingConfig {
  const params = (workflow.params ?? {}) as Partial<KlingConfig>

  return {
    model: 'kling',
    negative_prompt: params.negative_prompt ?? '',
    cfg_scale: params.cfg_scale ?? 0.5,
    duration: coerceDuration(params.duration ?? workflow.duration),
    aspect_ratio: (params.aspect_ratio ?? workflow.aspectRatio ?? '9:16') as KlingConfig['aspect_ratio'],
    camera_control: params.camera_control ?? null,
    advanced_camera_control: params.advanced_camera_control ?? null,
  }
}

async function downloadVideo(videoUrl: string, filenamePrefix: string): Promise<string> {
  await ensureVideoDir()
  const safePrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safePrefix}_${Date.now()}.mp4`
  const filepath = path.join(VIDEO_DIR, filename)

  try {
    const response = await fetch(videoUrl)
    if (!response.ok) {
      console.error(`[BatchQueue] Failed to download video: ${response.status}`)
      return videoUrl
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    await writeFile(filepath, buffer)
    return `/generated/videos/${filename}`
  } catch (error) {
    console.error('[BatchQueue] Failed to download video, using remote URL:', error)
    return videoUrl
  }
}

function getProvider(workflow: BatchWorkflow): BatchProvider {
  if (workflow.provider === 'seedance' || workflow.provider === 'kling' || workflow.provider === 'veo') {
    return workflow.provider
  }
  return 'seedance'
}

async function resolveReferenceImageUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  if (url.startsWith('https://')) return url
  try {
    const imagePath = url.startsWith('/')
      ? path.join(process.cwd(), 'public', url)
      : url
    const publicUrl = await uploadToImgBB(imagePath)
    console.log(`[BatchQueue] Uploaded reference image to ImgBB: ${publicUrl}`)
    return publicUrl
  } catch (err) {
    console.error(`[BatchQueue] Failed to upload reference image to ImgBB:`, err)
    return null
  }
}

export interface BatchProcessResult {
  success: boolean
  skipped?: boolean
  videoUrl?: string
  seed?: number | null
  error?: string
}

export async function processPreviewGeneration(previewId: string): Promise<BatchProcessResult> {
  const preview = await prisma.batchWorkflowPreview.findUnique({
    where: { id: previewId },
    include: { workflow: true },
  })

  if (!preview) {
    return { success: false, error: 'Preview not found' }
  }

  if (preview.status === 'completed') {
    return { success: true, skipped: true, videoUrl: preview.videoUrl ?? undefined, seed: preview.seed ?? null }
  }

  if (preview.status === 'generating') {
    return { success: false, skipped: true, error: 'Preview already generating' }
  }

  await prisma.batchWorkflowPreview.update({
    where: { id: previewId },
    data: { status: 'generating', error: null },
  })

  const workflow = preview.workflow
  const provider = getProvider(workflow)
  let config: SeedanceConfig | KlingConfig

  if (provider === 'seedance') {
    const seedOverride = workflow.workflowType === 'seed_lock' ? preview.seed ?? null : undefined
    config = buildSeedanceConfig(workflow, seedOverride)
  } else if (provider === 'kling') {
    config = buildKlingConfig(workflow)
  } else {
    const errorMsg = 'Veo not yet implemented'
    await prisma.batchWorkflowPreview.update({
      where: { id: previewId },
      data: { status: 'failed', error: errorMsg },
    })
    return { success: false, error: errorMsg }
  }

  // Get reference image from the matching queue item
  const queueItem = await prisma.batchWorkflowQueueItem.findFirst({
    where: { workflowId: workflow.id, characterId: preview.characterId },
    select: { referenceImageUrl: true },
  })
  const resolvedImageUrl = await resolveReferenceImageUrl(queueItem?.referenceImageUrl)

  let result: BatchProviderResult
  try {
    console.log(`[BatchQueue] Generating preview ${previewId} via ${provider}`)
    result = await generateBatchVideo(provider, preview.prompt, config, resolvedImageUrl)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Preview generation failed'
    await prisma.batchWorkflowPreview.update({
      where: { id: previewId },
      data: { status: 'failed', error: errorMsg },
    })
    return { success: false, error: errorMsg }
  }

  if (result.success && result.videoUrl) {
    let finalUrl = result.videoUrl
    try {
      const cloudinaryUrl = await uploadVideoToCloudinary(result.videoUrl)
      if (cloudinaryUrl !== result.videoUrl) {
        finalUrl = cloudinaryUrl
        console.log('[BatchQueue] Re-uploaded to Cloudinary:', cloudinaryUrl)
      }
    } catch (err) {
      console.error('[BatchQueue] Cloudinary upload failed, falling back:', err)
      finalUrl = await downloadVideo(result.videoUrl, `preview_${previewId}`)
    }
    const finalSeed = result.seed ?? (provider === 'seedance' ? (config as import('@/lib/models/types').SeedanceConfig).seed ?? null : null)

    await prisma.batchWorkflowPreview.update({
      where: { id: previewId },
      data: {
        status: 'completed',
        videoUrl: finalUrl,
        seed: finalSeed ?? preview.seed ?? null,
        error: null,
      },
    })

    return { success: true, videoUrl: finalUrl, seed: finalSeed ?? null }
  }

  const errorMsg = result.error || 'Preview generation failed'
  await prisma.batchWorkflowPreview.update({
    where: { id: previewId },
    data: { status: 'failed', error: errorMsg },
  })

  return { success: false, error: errorMsg }
}

export async function processBatchWorkflowItem(
  queueItemId: string,
  options?: { finalAttempt?: boolean }
): Promise<BatchProcessResult> {
  const item = await prisma.batchWorkflowQueueItem.findUnique({
    where: { id: queueItemId },
    include: { workflow: true },
  })

  if (!item) {
    return { success: false, error: 'Queue item not found' }
  }

  if (item.status === 'cancelled') {
    return { success: false, skipped: true, error: 'Queue item cancelled' }
  }

  if (item.status === 'completed') {
    return { success: true, skipped: true, videoUrl: item.videoUrl ?? undefined }
  }

  if (item.workflow.status === 'cancelled') {
    await prisma.batchWorkflowQueueItem.update({
      where: { id: queueItemId },
      data: { status: 'cancelled', error: 'Workflow cancelled' },
    })
    return { success: false, skipped: true, error: 'Workflow cancelled' }
  }

  await prisma.batchWorkflowQueueItem.update({
    where: { id: queueItemId },
    data: { status: 'generating', error: null },
  })

  const workflow = item.workflow
  const provider = getProvider(workflow)
  let config: SeedanceConfig | KlingConfig

  if (provider === 'seedance') {
    const seedOverride = workflow.workflowType === 'seed_lock' ? item.seed ?? null : undefined
    config = buildSeedanceConfig(workflow, seedOverride)
  } else if (provider === 'kling') {
    config = buildKlingConfig(workflow)
  } else {
    const errorMsg = 'Veo not yet implemented'
    if (options?.finalAttempt) {
      await prisma.batchWorkflowQueueItem.update({
        where: { id: queueItemId },
        data: { status: 'failed', error: errorMsg },
      })
      await prisma.batchWorkflow.update({
        where: { id: workflow.id },
        data: { failedItems: { increment: 1 } },
      })
    } else {
      await prisma.batchWorkflowQueueItem.update({
        where: { id: queueItemId },
        data: { status: 'pending', error: errorMsg },
      })
    }
    return { success: false, error: errorMsg }
  }

  // Resolve reference image to public URL for external APIs
  const resolvedItemImageUrl = await resolveReferenceImageUrl(item.referenceImageUrl)

  let result: BatchProviderResult
  try {
    console.log(`[BatchQueue] Generating queue item ${queueItemId} via ${provider}`)
    result = await generateBatchVideo(provider, item.prompt, config, resolvedItemImageUrl)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Video generation failed'
    if (options?.finalAttempt) {
      await prisma.batchWorkflowQueueItem.update({
        where: { id: queueItemId },
        data: { status: 'failed', error: errorMsg },
      })
      await prisma.batchWorkflow.update({
        where: { id: workflow.id },
        data: { failedItems: { increment: 1 } },
      })
    } else {
      await prisma.batchWorkflowQueueItem.update({
        where: { id: queueItemId },
        data: { status: 'pending', error: errorMsg },
      })
    }
    return { success: false, error: errorMsg }
  }

  if (result.success && result.videoUrl) {
    let finalUrl = result.videoUrl
    try {
      const cloudinaryUrl = await uploadVideoToCloudinary(result.videoUrl)
      if (cloudinaryUrl !== result.videoUrl) {
        finalUrl = cloudinaryUrl
        console.log('[BatchQueue] Re-uploaded to Cloudinary:', cloudinaryUrl)
      }
    } catch (err) {
      console.error('[BatchQueue] Cloudinary upload failed, falling back:', err)
      finalUrl = await downloadVideo(result.videoUrl, `workflow_${workflow.id}_${queueItemId}`)
    }

    await prisma.batchWorkflowQueueItem.update({
      where: { id: queueItemId },
      data: { status: 'completed', videoUrl: finalUrl, error: null },
    })

    await prisma.batchWorkflow.update({
      where: { id: workflow.id },
      data: { completedItems: { increment: 1 } },
    })

    // Auto-promote to ContentItem so it appears in /library
    try {
      await prisma.contentItem.create({
        data: {
          title: `Video: ${(item.prompt || workflow.basePrompt || 'Batch video').slice(0, 55)}`,
          prompt: item.prompt || workflow.basePrompt || '',
          generator: provider,
          status: 'generated',
          type: 'video',
          videoUrl: finalUrl,
          characterId: item.characterId || null,
          generationParams: {
            source: 'batch_workflow',
            batchWorkflowId: workflow.id,
            batchQueueItemId: queueItemId,
            workflowType: workflow.workflowType,
          },
        },
      })
      console.log(`[BatchQueue] Auto-promoted queue item ${queueItemId} to ContentItem (library)`)
    } catch (promoteErr) {
      console.error(`[BatchQueue] Failed to auto-promote queue item ${queueItemId} to ContentItem:`, promoteErr)
    }

    return { success: true, videoUrl: finalUrl }
  }

  const errorMsg = result.error || 'Video generation failed'
  if (options?.finalAttempt) {
    await prisma.batchWorkflowQueueItem.update({
      where: { id: queueItemId },
      data: { status: 'failed', error: errorMsg },
    })
    await prisma.batchWorkflow.update({
      where: { id: workflow.id },
      data: { failedItems: { increment: 1 } },
    })
  } else {
    await prisma.batchWorkflowQueueItem.update({
      where: { id: queueItemId },
      data: { status: 'pending', error: errorMsg },
    })
  }

  return { success: false, error: errorMsg }
}

export type { BatchWorkflow, BatchWorkflowPreview, BatchWorkflowQueueItem }
