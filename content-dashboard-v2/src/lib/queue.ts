// In-process generation queue with concurrency control
// V2: Fixed batch completion, async FS, queue recovery, counter safety

import { prisma } from '@/lib/prisma'
import { generateImage } from '@/lib/generation'
import { generateVideo } from '@/lib/video-generation'
import { uploadToImgBB } from '@/lib/imgbb'
import type { ModelConfig, SeedanceConfig, KlingConfig } from '@/lib/models'
import { MODEL_DEFAULTS } from '@/lib/models'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated')
const VIDEO_DIR = path.join(GENERATED_DIR, 'videos')
const DEFAULT_GENERATION_CONCURRENCY = 5
const generationConcurrency = (() => {
  const raw = process.env.GENERATION_CONCURRENCY
  if (!raw) return DEFAULT_GENERATION_CONCURRENCY
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GENERATION_CONCURRENCY
})()

// Ensure directories exist (async, fire-and-forget on import)
;(async () => {
  await mkdir(GENERATED_DIR, { recursive: true })
  await mkdir(VIDEO_DIR, { recursive: true })
})().catch(console.error)

export interface QueueItem {
  contentItemId: string
  batchId?: string
  prompt: string
  negativePrompt?: string
  modelConfig: ModelConfig
  presetImageUrl?: string | null
  manualReferenceImages?: string[] | null
  // Legacy fields (for queue recovery of old items)
  referenceImageUrl?: string | null
  referenceImages?: string[] | null
}

export interface VideoQueueItem {
  contentItemId: string
  batchId?: string
  prompt: string
  modelConfig: ModelConfig
  referenceImageUrl?: string | null
}

export interface QueueStatus {
  queued: number
  processing: number
  maxConcurrent: number
  videoQueued: number
  videoProcessing: number
}

type QueueCallback = (itemId: string, success: boolean, url?: string, error?: string) => void

// SSE listeners for real-time progress
type SSEListener = (event: string, data: any) => void

class GenerationQueue {
  private queue: QueueItem[] = []
  private processing = 0
  private maxConcurrent = generationConcurrency

  private videoQueue: VideoQueueItem[] = []
  private videoProcessing = 0
  private maxVideosConcurrent = 1

  private onComplete: QueueCallback | null = null
  private sseListeners: Map<string, Set<SSEListener>> = new Map()

  constructor() {
    // Phase 2.1: Recover orphaned items on startup
    setTimeout(() => this.recoverOrphans().catch(console.error), 2000)
  }

  setOnComplete(cb: QueueCallback) {
    this.onComplete = cb
  }

  // ============ SSE (Phase 2.5) ============

  addSSEListener(batchId: string, listener: SSEListener) {
    if (!this.sseListeners.has(batchId)) {
      this.sseListeners.set(batchId, new Set())
    }
    this.sseListeners.get(batchId)!.add(listener)
  }

  removeSSEListener(batchId: string, listener: SSEListener) {
    this.sseListeners.get(batchId)?.delete(listener)
    if (this.sseListeners.get(batchId)?.size === 0) {
      this.sseListeners.delete(batchId)
    }
  }

  private notifySSE(batchId: string | undefined, event: string, data: any) {
    if (!batchId) return
    const listeners = this.sseListeners.get(batchId)
    if (listeners) {
      for (const listener of listeners) {
        try { listener(event, data) } catch {}
      }
    }
  }

  // ============ Image Queue ============

  async add(item: QueueItem): Promise<void> {
    this.queue.push(item)
    this.processNext()
  }

  async addMany(items: QueueItem[]): Promise<void> {
    this.queue.push(...items)
    for (let i = 0; i < Math.min(items.length, this.maxConcurrent); i++) {
      this.processNext()
    }
  }

  // ============ Video Queue ============

  async addVideo(item: VideoQueueItem): Promise<void> {
    this.videoQueue.push(item)
    this.processNextVideo()
  }

  async addManyVideos(items: VideoQueueItem[]): Promise<void> {
    this.videoQueue.push(...items)
    for (let i = 0; i < Math.min(items.length, this.maxVideosConcurrent); i++) {
      this.processNextVideo()
    }
  }

  // ============ Status ============

  getStatus(): QueueStatus {
    return {
      queued: this.queue.length,
      processing: this.processing,
      maxConcurrent: this.maxConcurrent,
      videoQueued: this.videoQueue.length,
      videoProcessing: this.videoProcessing,
    }
  }

  // ============ Phase 2.1: Queue Recovery ============

  async recoverOrphans(): Promise<void> {
    try {
      const orphanedItems = await prisma.contentItem.findMany({
        where: { status: { in: ['generating', 'queued'] } },
      })

      if (orphanedItems.length === 0) return

      const imageOrphans = orphanedItems.filter(i => i.type === 'image')
      const videoOrphans = orphanedItems.filter(i => i.type === 'video')

      if (imageOrphans.length > 0) {
        console.log(`[Queue] Recovering ${imageOrphans.length} orphaned image items`)
        const items: QueueItem[] = imageOrphans.map(i => {
          const p = i.generationParams as any
          const modelConfig = (p?.model ? p : MODEL_DEFAULTS.nano_banana_pro) as ModelConfig
          return {
            contentItemId: i.id,
            batchId: i.batchId || undefined,
            prompt: i.prompt,
            negativePrompt: i.negativePrompt || undefined,
            modelConfig,
            presetImageUrl: p?.presetImageUrl || null,
            manualReferenceImages: p?.manualReferenceImages || null,
            // Legacy fallback
            referenceImageUrl: p?.referenceImageUrl || null,
            referenceImages: p?.referenceImages || null,
          }
        })
        await this.addMany(items)
      }

      if (videoOrphans.length > 0) {
        console.log(`[Queue] Recovering ${videoOrphans.length} orphaned video items`)
        const items: VideoQueueItem[] = videoOrphans.map(i => {
          const p = i.generationParams as any
          const modelConfig = (p?.model ? p : MODEL_DEFAULTS.seedance) as ModelConfig
          return {
            contentItemId: i.id,
            batchId: i.batchId || undefined,
            prompt: i.prompt,
            modelConfig,
            referenceImageUrl: p?.referenceImageUrl,
          }
        })
        await this.addManyVideos(items)
      }
    } catch (error) {
      console.error('[Queue] Recovery failed:', error)
    }
  }

  // ============ Shared Processing Logic (Phase 2.2) ============

  private async handleItemSuccess(
    contentItemId: string,
    batchId: string | undefined,
    urlField: 'imageUrl' | 'videoUrl',
    localUrl: string
  ) {
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { status: 'generated', [urlField]: localUrl },
    })

    if (batchId) {
      await this.checkBatchCompletion(batchId)
      this.notifySSE(batchId, 'item-complete', { contentItemId, url: localUrl })
    }

    this.onComplete?.(contentItemId, true, localUrl)
  }

  private async handleItemFailure(
    contentItemId: string,
    batchId: string | undefined,
    errorMsg: string
  ) {
    console.error(`[Queue] Item ${contentItemId} FAILED: ${errorMsg}`)
    try {
      // Store error in generationParams for UI visibility
      const existing = await prisma.contentItem.findUnique({ where: { id: contentItemId } })
      const params = (existing?.generationParams as any) || {}
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: {
          status: 'failed',
          generationParams: { ...params, _error: errorMsg, _failedAt: new Date().toISOString() } as any,
        },
      })

      if (batchId) {
        await this.checkBatchCompletion(batchId)
        this.notifySSE(batchId, 'item-failed', { contentItemId, error: errorMsg })
      }
    } catch (dbError) {
      console.error('[Queue] Failed to update status after error:', dbError)
    }

    this.onComplete?.(contentItemId, false, undefined, errorMsg)
  }

  // ============ Image Processing ============

  private async processNext(): Promise<void> {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const item = this.queue.shift()!
    this.processing++

    try {
      await prisma.contentItem.update({
        where: { id: item.contentItemId },
        data: { status: 'generating' },
      })

      this.notifySSE(item.batchId, 'item-generating', { contentItemId: item.contentItemId })

      if (item.modelConfig.model !== 'nano_banana_pro' && item.modelConfig.model !== 'nano_banana_2') {
        throw new Error(`Invalid image model for image queue: ${item.modelConfig.model}`)
      }

      // Build reference images list: preset image first, then manual references
      const allRefs: string[] = []
      const presetImg = item.presetImageUrl || item.referenceImageUrl // fallback for legacy
      if (presetImg) allRefs.push(presetImg)
      const manualRefs = item.manualReferenceImages || item.referenceImages // fallback for legacy
      if (manualRefs) allRefs.push(...manualRefs)

      console.log(`[Queue] Processing ${item.contentItemId}: presetImage=${presetImg?.slice(0, 60) || 'none'}, manualRefs=${manualRefs?.length || 0}, totalRefs=${allRefs.length}`)

      const result = await generateImage(item.prompt, item.modelConfig, allRefs.length > 0 ? allRefs : null)

      if (result.success && result.imageUrl) {
        const base64Data = result.imageUrl.replace(/^data:image\/\w+;base64,/, '')
        const timestamp = Date.now()
        const filename = `gen_${item.contentItemId}_${timestamp}.jpg`
        const filepath = path.join(GENERATED_DIR, filename)
        const imageBuffer = Buffer.from(base64Data, 'base64')
        // Phase 2.3: Async file write
        await writeFile(filepath, imageBuffer)

        const localUrl = `/generated/${filename}`
        if (item.batchId) {
          await prisma.batch.update({
            where: { id: item.batchId },
            data: { completed: { increment: 1 } },
          })
        }
        await this.handleItemSuccess(item.contentItemId, item.batchId, 'imageUrl', localUrl)
      } else {
        if (item.batchId) {
          await prisma.batch.update({
            where: { id: item.batchId },
            data: { failed: { increment: 1 } },
          })
        }
        await this.handleItemFailure(
          item.contentItemId, item.batchId, result.error || 'Generation failed'
        )
      }
    } catch (error) {
      console.error(`[Queue] Error processing item ${item.contentItemId}:`, error)
      if (item.batchId) {
        await prisma.batch.update({
          where: { id: item.batchId },
          data: { failed: { increment: 1 } },
        })
      }
      await this.handleItemFailure(
        item.contentItemId, item.batchId,
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      this.processing--
      this.processNext()
    }
  }

  // ============ Video Processing ============

  private async processNextVideo(): Promise<void> {
    if (this.videoProcessing >= this.maxVideosConcurrent || this.videoQueue.length === 0) {
      return
    }

    const item = this.videoQueue.shift()!
    this.videoProcessing++

    try {
      await prisma.contentItem.update({
        where: { id: item.contentItemId },
        data: { status: 'generating' },
      })

      this.notifySSE(item.batchId, 'item-generating', { contentItemId: item.contentItemId })

      if (item.modelConfig.model !== 'seedance' && item.modelConfig.model !== 'kling') {
        throw new Error(`Invalid video model: ${item.modelConfig.model}`)
      }

      const isSeedance = item.modelConfig.model === 'seedance'

      // Upload reference image to ImgBB if it's a localhost URL (ByteDance API requires public URLs)
      let publicRefUrl = item.referenceImageUrl || null
      if (publicRefUrl && (publicRefUrl.includes('localhost') || publicRefUrl.includes('127.0.0.1') || publicRefUrl.startsWith('/'))) {
        try {
          console.log(`[Queue] Uploading reference image to ImgBB for public URL...`)
          publicRefUrl = await uploadToImgBB(publicRefUrl)
          console.log(`[Queue] ImgBB upload success: ${publicRefUrl}`)
        } catch (uploadErr) {
          console.error(`[Queue] ImgBB upload failed, proceeding without reference image:`, uploadErr)
          publicRefUrl = null
        }
      }

      let result = await generateVideo(item.prompt, item.modelConfig as SeedanceConfig | KlingConfig, publicRefUrl)

      // Seedance→Kling fallback: if Seedance fails, retry with Kling
      if (isSeedance && !result.success) {
        const seedanceError = result.error || 'Unknown Seedance error'
        console.log(`[Queue] Seedance failed for ${item.contentItemId}: ${seedanceError}. Falling back to Kling...`)
        this.notifySSE(item.batchId, 'item-fallback', {
          contentItemId: item.contentItemId,
          from: 'seedance',
          to: 'kling',
          reason: seedanceError,
        })

        // Build Kling config preserving duration and aspect ratio where compatible
        const seedCfg = item.modelConfig as SeedanceConfig
        const klingAspect = (['1:1', '16:9', '9:16'] as const).includes(seedCfg.aspect_ratio as any)
          ? (seedCfg.aspect_ratio as KlingConfig['aspect_ratio'])
          : '9:16'
        const klingConfig: KlingConfig = {
          model: 'kling',
          negative_prompt: '',
          cfg_scale: 0.5,
          duration: seedCfg.duration,
          aspect_ratio: klingAspect,
          camera_control: null,
          advanced_camera_control: null,
        }

        result = await generateVideo(item.prompt, klingConfig, publicRefUrl)

        if (result.success) {
          console.log(`[Queue] Kling fallback succeeded for ${item.contentItemId}`)
          // Update generationParams to reflect the actual model used
          await prisma.contentItem.update({
            where: { id: item.contentItemId },
            data: { generationParams: klingConfig as any },
          })
        } else {
          console.error(`[Queue] Kling fallback also failed for ${item.contentItemId}: ${result.error}`)
        }
      }

      if (result.success && result.videoUrl) {
        const timestamp = Date.now()
        const filename = `video_${item.contentItemId}_${timestamp}.mp4`
        let localUrl = result.videoUrl

        try {
          const videoResponse = await fetch(result.videoUrl)
          if (videoResponse.ok) {
            const buffer = Buffer.from(await videoResponse.arrayBuffer())
            const filepath = path.join(VIDEO_DIR, filename)
            // Phase 2.3: Async file write
            await writeFile(filepath, buffer)
            localUrl = `/generated/videos/${filename}`
            console.log(`[Queue] Video saved locally: ${localUrl}`)
          }
        } catch (dlErr) {
          console.error('[Queue] Failed to download video, using remote URL:', dlErr)
        }

        if (item.batchId) {
          await prisma.batch.update({
            where: { id: item.batchId },
            data: { completed: { increment: 1 } },
          })
        }
        await this.handleItemSuccess(item.contentItemId, item.batchId, 'videoUrl', localUrl)
      } else {
        if (item.batchId) {
          await prisma.batch.update({
            where: { id: item.batchId },
            data: { failed: { increment: 1 } },
          })
        }
        await this.handleItemFailure(
          item.contentItemId, item.batchId, result.error || 'Video generation failed'
        )
      }
    } catch (error) {
      console.error(`[Queue] Error processing video item ${item.contentItemId}:`, error)
      if (item.batchId) {
        await prisma.batch.update({
          where: { id: item.batchId },
          data: { failed: { increment: 1 } },
        })
      }
      await this.handleItemFailure(
        item.contentItemId, item.batchId,
        error instanceof Error ? error.message : 'Unknown video error'
      )
    } finally {
      this.videoProcessing--
      this.processNextVideo()
    }
  }

  // ============ Shared ============

  private async checkBatchCompletion(batchId: string): Promise<void> {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } })
    if (!batch) return

    const done = batch.completed + batch.failed
    if (done >= batch.totalItems) {
      // Phase 1.1: Fix — was 'completed' for both branches, now correctly uses 'completed_with_errors'
      const finalStatus = batch.failed > 0 && batch.completed === 0
        ? 'failed'
        : batch.failed > 0
          ? 'completed_with_errors'
          : 'completed'

      await prisma.batch.update({
        where: { id: batchId },
        data: { status: finalStatus },
      })

      this.notifySSE(batchId, 'batch-complete', { batchId, status: finalStatus })
    }
  }
}

// Singleton queue instance
const globalForQueue = globalThis as unknown as {
  generationQueue: GenerationQueue | undefined
}

export const generationQueue =
  globalForQueue.generationQueue ?? new GenerationQueue()

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.generationQueue = generationQueue
}
