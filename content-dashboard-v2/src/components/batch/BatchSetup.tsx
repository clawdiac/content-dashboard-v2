'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useBatchWorkflow, type BatchWorkflow, type BatchWorkflowProvider } from '@/hooks/useBatchWorkflow'

interface BatchSetupProps {
  onWorkflowCreated?: (workflow: BatchWorkflow) => void
}

interface VideoPresetGroup {
  name: string
  presetId: string // Use first matching preset as reference
  characterCount: number
  promptTemplate: string
  duration: number
  aspectRatio: string
  resolution: string
}

const providerConfig: Record<BatchWorkflowProvider, { label: string; description: string; disabled?: boolean }> = {
  kling: { label: 'Kling', description: 'Seed-lock workflow — generate 4 test videos, pick the best seed' },
  seedance: { label: 'Seedance', description: 'Prompt-lock workflow — refine prompt, then batch all' },
  veo: { label: 'Veo', description: 'Prompt-lock workflow — refine prompt, then batch all', disabled: true },
}

export function BatchSetup({ onWorkflowCreated }: BatchSetupProps) {
  const { createWorkflow, isLoading, error } = useBatchWorkflow()
  const [presetGroups, setPresetGroups] = useState<VideoPresetGroup[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [provider, setProvider] = useState<BatchWorkflowProvider>('kling')
  const [loadingPresets, setLoadingPresets] = useState(true)
  const [presetError, setPresetError] = useState<string | null>(null)

  // Fetch all video presets and group by name
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoadingPresets(true)
      setPresetError(null)
      try {
        const res = await fetch('/api/video-presets', { signal: controller.signal })
        if (!res.ok) throw new Error('Failed to load video presets')
        const presets = await res.json()

        // Group by name — count unique characters per preset name
        const groups = new Map<string, VideoPresetGroup>()
        for (const preset of presets) {
          const existing = groups.get(preset.name)
          if (existing) {
            existing.characterCount++
          } else {
            groups.set(preset.name, {
              name: preset.name,
              presetId: preset.id,
              characterCount: 1,
              promptTemplate: preset.promptTemplate,
              duration: preset.duration,
              aspectRatio: preset.aspectRatio,
              resolution: preset.resolution,
            })
          }
        }

        setPresetGroups(Array.from(groups.values()))
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setPresetError(err instanceof Error ? err.message : 'Failed to load presets')
      } finally {
        setLoadingPresets(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const selectedGroup = useMemo(
    () => presetGroups.find((g) => g.presetId === selectedPresetId) ?? null,
    [presetGroups, selectedPresetId]
  )

  const workflowType = provider === 'kling' ? 'seed_lock' : 'prompt_lock'

  const handleCreate = async () => {
    if (!selectedPresetId) return
    const workflow = await createWorkflow({
      presetId: selectedPresetId,
      provider,
    })
    if (workflow) {
      onWorkflowCreated?.(workflow)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Batch Workflow Setup</CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] uppercase',
              workflowType === 'seed_lock' ? 'text-emerald-500' : 'text-blue-500'
            )}
          >
            {workflowType === 'seed_lock' ? 'Seed Lock' : 'Prompt Lock'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        {/* Step 1: Select Video Preset */}
        <div className="grid gap-2">
          <Label>Video Preset</Label>
          {loadingPresets ? (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Loading presets...
            </div>
          ) : presetError ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
              {presetError}
            </div>
          ) : presetGroups.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No video presets found. Create presets in Settings first.
            </div>
          ) : (
            <Select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
            >
              <SelectItem value="" disabled>
                Select a video preset...
              </SelectItem>
              {presetGroups.map((group) => (
                <SelectItem key={group.presetId} value={group.presetId}>
                  {group.name} — {group.characterCount} character{group.characterCount !== 1 ? 's' : ''}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>

        {/* Preset Info */}
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border bg-muted/30 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedGroup.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {selectedGroup.characterCount} character{selectedGroup.characterCount !== 1 ? 's' : ''} queued
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{selectedGroup.promptTemplate}</p>
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              <span>{selectedGroup.aspectRatio}</span>
              <span>{selectedGroup.duration}s</span>
              <span>{selectedGroup.resolution}</span>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Provider */}
        <div className="grid gap-2">
          <Label>Generation Model</Label>
          <div className="grid gap-2">
            {(Object.entries(providerConfig) as [BatchWorkflowProvider, typeof providerConfig[BatchWorkflowProvider]][]).map(
              ([key, config]) => (
                <label
                  key={key}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    provider === key ? 'border-primary/60 bg-primary/5' : 'border-border hover:bg-muted/40',
                    config.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={key}
                    checked={provider === key}
                    onChange={() => !config.disabled && setProvider(key)}
                    disabled={config.disabled}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">
                      {config.label}
                      {config.disabled && <span className="text-muted-foreground ml-1">(coming soon)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </div>
                </label>
              )
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {error}
          </div>
        )}

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="default"
            className="w-full"
            onClick={handleCreate}
            disabled={isLoading || !selectedPresetId || providerConfig[provider].disabled}
          >
            {isLoading
              ? 'Creating...'
              : selectedGroup
                ? `Create Workflow — ${selectedGroup.characterCount} Characters`
                : 'Create Workflow'}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )
}
