'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSSE } from '@/context/SSEContext'
import { useBatchStore } from '@/store/batch'
import { useApprovalStore } from '@/store/approval'
import { useConfigStore } from '@/store/config'
import {
  VideoModeSelector,
  ApprovedImagesSelector,
  VideoPresetSelector,
  VideoPromptEditor,
  VideoProgressGrid,
  type VideoMode,
  type VideoItem,
} from '@/components/video'
import type { BatchStats } from '@/types'

export default function VideoWorkflowPage() {
  const { connected } = useSSE()
  const { batches, activeBatchId, cancelBatch, pauseBatch, clearError, error: batchError } = useBatchStore()
  const fetchItems = useApprovalStore((s) => s.fetchItems)
  const fetchPresets = useConfigStore((s) => s.fetchPresets)

  // Mode
  const [mode, setMode] = useState<VideoMode>('from-images')

  // Selection state
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set())
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set())

  // Prompt state
  const [prompt, setPrompt] = useState('')
  const [videoModel, setVideoModel] = useState('seedance')
  const [seed, setSeed] = useState<number | undefined>()
  const [durationOverride, setDurationOverride] = useState<number | undefined>()
  const [aspectRatioOverride, setAspectRatioOverride] = useState<string | undefined>()

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    fetchItems()
    fetchPresets()
  }, [fetchItems, fetchPresets])

  // Active batch
  const activeBatch = activeBatchId ? batches[activeBatchId] : null
  const isRunning = activeBatch?.status === 'running'

  // Map batch jobs to video grid items (BUG 3 fix: use job-level model/duration)
  const gridItems: VideoItem[] = activeBatch
    ? activeBatch.jobs.map((j) => ({
        id: j.id,
        title: j.character?.displayName || j.id,
        status: j.status === 'queued' ? 'queued' : j.status === 'running' ? 'generating' : j.status === 'completed' ? 'completed' : j.status === 'failed' ? 'failed' : 'pending',
        progress: j.progress,
        thumbnailUrl: j.thumbnailUrl,
        videoUrl: j.outputUrl,
        error: j.error,
        model: (j.metadata?.model as string) || videoModel,
        duration: (j.metadata?.duration as number) || durationOverride,
      }))
    : []

  const gridStats: BatchStats | null = activeBatch?.stats ?? null

  // Image selection helpers (BUG 2 fix: memoize to prevent new array ref each render)
  const allItems = useApprovalStore((s) => s.items)
  const approvedImages = useMemo(
    () => allItems.filter((i) => i.approvalStatus === 'approved' && i.type === 'image' && i.eligibleForVideo),
    [allItems]
  )

  const toggleImage = useCallback((id: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAllImages = useCallback(() => {
    setSelectedImageIds(new Set(approvedImages.map((i) => i.id)))
  }, [approvedImages])

  const selectNoImages = useCallback(() => {
    setSelectedImageIds(new Set())
  }, [])

  const togglePreset = useCallback((id: string) => {
    setSelectedPresetIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Validation (fix 4: mixed requires BOTH images AND presets)
  const hasSource =
    (mode === 'from-images' && selectedImageIds.size > 0) ||
    (mode === 'from-presets' && selectedPresetIds.size > 0) ||
    (mode === 'mixed' && (selectedImageIds.size > 0 && selectedPresetIds.size > 0))

  const canGenerate = prompt.trim().length > 0 && hasSource && !submitting

  // Submit
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return
    setSubmitting(true)
    setSubmitError(null)
    clearError()

    try {
      const body: Record<string, unknown> = {
        mode,
        prompt: prompt.trim(),
        model: videoModel,
        seed,
        durationOverride,
        aspectRatioOverride,
      }

      if (mode === 'from-images' || mode === 'mixed') {
        body.imageIds = Array.from(selectedImageIds)
      }
      if (mode === 'from-presets' || mode === 'mixed') {
        body.presetIds = Array.from(selectedPresetIds)
      }

      // Mode 1/3 use /api/video, Mode 2 uses /api/video/batch
      const endpoint = mode === 'from-presets' ? '/api/video/batch' : '/api/video'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed: ${res.status}`)
      }

      const data = await res.json()

      // Initialize batch in store
      useBatchStore.setState((state) => ({
        activeBatchId: data.batchId,
        batches: {
          ...state.batches,
          [data.batchId]: {
            id: data.batchId,
            type: 'video',
            status: 'running',
            jobs: (data.items || []).map((item: any) => ({
              id: item.id,
              batchId: data.batchId,
              type: 'video' as const,
              status: 'queued' as const,
              progress: 0,
              character: { id: '', name: '', displayName: item.title || 'Video' },
              preset: { id: '', name: '', displayName: '', model: videoModel, duration: 0, fps: 0, width: 0, height: 0 },
            })),
            createdAt: new Date().toISOString(),
            stats: { total: data.totalItems || data.items?.length || 0, completed: 0, failed: 0, inProgress: 0 },
          },
        },
      }))
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Video generation failed')
    } finally {
      setSubmitting(false)
    }
  }, [canGenerate, mode, prompt, videoModel, seed, durationOverride, aspectRatioOverride, selectedImageIds, selectedPresetIds, clearError])

  // ⌘+Enter shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleGenerate])

  const handleStop = useCallback(() => {
    if (!activeBatchId) return
    if (!window.confirm('Stop this video batch? Items in progress will be cancelled.')) return
    cancelBatch(activeBatchId)
  }, [activeBatchId, cancelBatch])

  const handlePause = useCallback(() => {
    if (activeBatchId) pauseBatch(activeBatchId)
  }, [activeBatchId, pauseBatch])

  const handleRetry = useCallback(async (itemId: string) => {
    try {
      const res = await fetch(`/api/video/${itemId}/regenerate`, { method: 'POST' })
      if (!res.ok) throw new Error(`Retry failed: ${res.status}`)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Retry failed')
    }
  }, [])

  const itemCount =
    mode === 'from-images' ? selectedImageIds.size :
    mode === 'from-presets' ? selectedPresetIds.size :
    selectedImageIds.size + selectedPresetIds.size

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0 overflow-hidden">
      {/* Left pane — Configuration */}
      <div className="lg:w-[420px] xl:w-[480px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
        <div className="p-5 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold">Video Generation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Generate videos from approved images or video presets
            </p>
          </div>

          {/* Connection */}
          <div className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-500' : 'bg-red-400')} />
            <span className="text-xs text-muted-foreground">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>

          {/* Mode Selector */}
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Mode</h2>
            <VideoModeSelector value={mode} onChange={setMode} />
          </section>

          {/* Source Selection — conditional on mode */}
          {(mode === 'from-images' || mode === 'mixed') && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">Approved Images</h2>
              <ApprovedImagesSelector
                selectedIds={selectedImageIds}
                onToggle={toggleImage}
                onSelectAll={selectAllImages}
                onSelectNone={selectNoImages}
              />
            </section>
          )}

          {(mode === 'from-presets' || mode === 'mixed') && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">Video Presets</h2>
              <VideoPresetSelector
                selectedIds={selectedPresetIds}
                onToggle={togglePreset}
              />
            </section>
          )}

          {/* Prompt */}
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Video Prompt</h2>
            <VideoPromptEditor
              value={prompt}
              onChange={setPrompt}
              videoModel={videoModel}
              onVideoModelChange={setVideoModel}
              seed={seed}
              onSeedChange={setSeed}
              durationOverride={durationOverride}
              onDurationChange={setDurationOverride}
              aspectRatioOverride={aspectRatioOverride}
              onAspectRatioChange={setAspectRatioOverride}
            />
          </section>

          {/* Errors */}
          {(submitError || batchError) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError || batchError}
            </motion.div>
          )}

          {/* SSE disconnect warning */}
          {!connected && hasSource && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400"
            >
              SSE disconnected — progress updates won't show
            </motion.div>
          )}

          {/* Generate button */}
          <button
            type="button"
            disabled={!canGenerate}
            onClick={handleGenerate}
            className={cn(
              'w-full rounded-lg py-3 text-sm font-semibold transition-all',
              canGenerate
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating video batch…
              </span>
            ) : (
              <span>
                Generate Videos {itemCount > 0 ? `(${itemCount} items)` : ''}
                <span className="ml-2 text-xs opacity-60">⌘↵</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Right pane — Progress */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {isRunning ? 'Generating Videos…' : activeBatch ? 'Batch Complete' : 'Progress'}
            </h2>
            {activeBatch && (
              <span className="text-xs text-muted-foreground tabular-nums">
                Batch {activeBatchId?.slice(0, 8)}
              </span>
            )}
          </div>

          <VideoProgressGrid
            items={gridItems}
            stats={gridStats}
            isRunning={isRunning}
            onStop={isRunning ? handleStop : undefined}
            onPause={isRunning ? handlePause : undefined}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </div>
  )
}
