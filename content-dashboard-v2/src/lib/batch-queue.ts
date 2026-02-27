// Batch workflow queue with concurrency control and retry logic

import { prisma } from '@/lib/prisma'
import { processBatchWorkflowItem, processPreviewGeneration } from '@/lib/batch-generator'

const MAX_RETRIES = 2
const BASE_DELAY_MS = 2000
const DEFAULT_CONCURRENCY = 2

class BatchWorkflowQueue {
  private concurrency: number
  private activeWorkflows = new Map<string, { cancelled: boolean }>()

  constructor(concurrency = DEFAULT_CONCURRENCY) {
    this.concurrency = concurrency
  }

  async startWorkflow(workflowId: string): Promise<void> {
    if (this.activeWorkflows.has(workflowId)) {
      console.log(`[BatchQueue] Workflow ${workflowId} already running`)
      return
    }

    const state = { cancelled: false }
    this.activeWorkflows.set(workflowId, state)

    try {
      await this.processWorkflow(workflowId, state)
    } finally {
      this.activeWorkflows.delete(workflowId)
    }
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    const state = this.activeWorkflows.get(workflowId)
    if (state) {
      state.cancelled = true
      console.log(`[BatchQueue] Cancellation requested for workflow ${workflowId}`)
    }
  }

  getStatus(workflowId: string): { active: boolean; cancelled: boolean } {
    const state = this.activeWorkflows.get(workflowId)
    return { active: !!state, cancelled: state?.cancelled ?? false }
  }

  async startPreviews(workflowId: string): Promise<void> {
    const previews = await prisma.batchWorkflowPreview.findMany({
      where: { workflowId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`[BatchQueue] Starting ${previews.length} preview(s) for workflow ${workflowId}`)

    // Process previews with concurrency
    const chunks = this.chunk(previews.map(p => p.id), this.concurrency)
    for (const chunk of chunks) {
      await Promise.all(chunk.map(id => processPreviewGeneration(id)))
    }

    console.log(`[BatchQueue] All previews completed for workflow ${workflowId}`)
  }

  private async processWorkflow(workflowId: string, state: { cancelled: boolean }): Promise<void> {
    const queueItems = await prisma.batchWorkflowQueueItem.findMany({
      where: { workflowId, status: { in: ['pending'] } },
      orderBy: { position: 'asc' },
    })

    console.log(`[BatchQueue] Processing ${queueItems.length} items for workflow ${workflowId}`)

    const chunks = this.chunk(queueItems.map(i => i.id), this.concurrency)

    for (const chunk of chunks) {
      if (state.cancelled) {
        console.log(`[BatchQueue] Workflow ${workflowId} cancelled, stopping`)
        break
      }

      await Promise.all(chunk.map(id => this.processItemWithRetry(id, state)))
    }

    // Determine final workflow status
    if (state.cancelled) return

    const workflow = await prisma.batchWorkflow.findUnique({ where: { id: workflowId } })
    if (!workflow) return

    const allItems = await prisma.batchWorkflowQueueItem.findMany({ where: { workflowId } })
    const allCompleted = allItems.every(i => i.status === 'completed' || i.status === 'failed' || i.status === 'cancelled')

    if (allCompleted) {
      const anySuccess = allItems.some(i => i.status === 'completed')
      const finalStatus = anySuccess ? 'completed' : 'failed'
      await prisma.batchWorkflow.update({
        where: { id: workflowId },
        data: { status: finalStatus },
      })
      console.log(`[BatchQueue] Workflow ${workflowId} finished with status: ${finalStatus}`)
    }
  }

  private async processItemWithRetry(
    queueItemId: string,
    state: { cancelled: boolean }
  ): Promise<void> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (state.cancelled) return

      const isFinalAttempt = attempt === MAX_RETRIES
      const result = await processBatchWorkflowItem(queueItemId, { finalAttempt: isFinalAttempt })

      if (result.success || result.skipped || isFinalAttempt) {
        return
      }

      // Increment retry count
      await prisma.batchWorkflowQueueItem.update({
        where: { id: queueItemId },
        data: { retryCount: { increment: 1 } },
      })

      const delay = BASE_DELAY_MS * Math.pow(2, attempt)
      console.log(`[BatchQueue] Retrying item ${queueItemId} in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }
}

export const batchWorkflowQueue = new BatchWorkflowQueue()
