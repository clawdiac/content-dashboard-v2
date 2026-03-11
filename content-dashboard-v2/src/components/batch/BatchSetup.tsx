'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useBatchWorkflow, type BatchWorkflow, type BatchWorkflowProvider, type CreateWorkflowInput } from '@/hooks/useBatchWorkflow'

interface BatchSetupProps {
  onWorkflowCreated?: (workflow: BatchWorkflow) => void
}

interface VideoPresetGroup {
  type: 'video'
  name: string
  presetId: string
  characterCount: number
  promptTemplate: string
  duration: number
  aspectRatio: string
  resolution: string
}

interface CharacterPresetGroup {
  type: 'character'
  name: string
  characterCount: number
}

type PresetGroup = VideoPresetGroup | CharacterPresetGroup

const providerConfig: Record<BatchWorkflowProvider, { label: string; description: string; disabled?: boolean }> = {
  kling: { label: 'Kling', description: 'Seed-lock workflow — generate 4 test videos, pick the best seed' },
  seedance: { label: 'Seedance', description: 'Prompt-lock workflow — refine prompt, then batch all' },
  veo: { label: 'Veo', description: 'Prompt-lock workflow — refine prompt, then batch all', disabled: true },
}

export function BatchSetup({ onWorkflowCreated }: BatchSetupProps) {
  const { createWorkflow, isLoading, error } = useBatchWorkflow()
  const [allGroups, setAllGroups] = useState<PresetGroup[]>([])
  const [selectionKey, setSelectionKey] = useState<string>('')
  const [selectedGroupName, setSelectedGroupName] = useState<string>('')
  const [selectedGroupType, setSelectedGroupType] = useState<'video' | 'character' | null>(null)
  const [provider, setProvider] = useState<BatchWorkflowProvider>('kling')
  const [loadingPresets, setLoadingPresets] = useState(true)
  const [presetError, setPresetError] = useState<string | null>(null)

  // Inline config for all workflows
  const [charDuration, setCharDuration] = useState(5)
  const [charAspectRatio, setCharAspectRatio] = useState('9:16')
  const [charResolution, setCharResolution] = useState('720p')

  // Fetch both video presets and character presets in parallel
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoadingPresets(true)
      setPresetError(null)
      try {
        const [videoRes, charRes] = await Promise.all([
          fetch('/api/video-presets', { signal: controller.signal }),
          fetch('/api/presets', { signal: controller.signal }),
        ])
        if (!videoRes.ok) throw new Error('Failed to load video presets')
        if (!charRes.ok) throw new Error('Failed to load character presets')

        const videoPresets = await videoRes.json()
        const charPresets = await charRes.json()

        // Group video presets by name
        const videoGroups = new Map<string, VideoPresetGroup>()
        for (const preset of videoPresets) {
          const existing = videoGroups.get(preset.name)
          if (existing) {
            existing.characterCount++
          } else {
            videoGroups.set(preset.name, {
              type: 'video',
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

        // Group character presets by name
        const charGroups = new Map<string, CharacterPresetGroup>()
        for (const preset of charPresets) {
          const existing = charGroups.get(preset.name)
          if (existing) {
            existing.characterCount++
          } else {
            charGroups.set(preset.name, {
              type: 'character',
              name: preset.name,
              characterCount: 1,
            })
          }
        }

        setAllGroups([
          ...Array.from(videoGroups.values()),
          ...Array.from(charGroups.values()),
        ])
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

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectionKey(value)
    if (!value) {
      setSelectedGroupName('')
      setSelectedGroupType(null)
      return
    }
    const colonIdx = value.indexOf(':')
    const type = value.slice(0, colonIdx) as 'video' | 'character'
    const name = value.slice(colonIdx + 1)
    setSelectedGroupType(type)
    setSelectedGroupName(name)
    if (type === 'video') {
      const group = allGroups.find((g) => g.type === 'video' && g.name === name) as VideoPresetGroup | undefined
      if (group) {
        setCharDuration(group.duration)
        setCharAspectRatio(group.aspectRatio)
        setCharResolution(group.resolution)
      }
    } else {
      setCharDuration(5)
      setCharAspectRatio('9:16')
      setCharResolution('720p')
    }
  }

  const selectedGroup = useMemo(
    () => allGroups.find((g) => g.type === selectedGroupType && g.name === selectedGroupName) ?? null,
    [allGroups, selectedGroupType, selectedGroupName]
  )

  const videoGroups = useMemo(() => allGroups.filter((g): g is VideoPresetGroup => g.type === 'video'), [allGroups])
  const charGroups = useMemo(() => allGroups.filter((g): g is CharacterPresetGroup => g.type === 'character'), [allGroups])

  const workflowType = provider === 'kling' ? 'seed_lock' : 'prompt_lock'

  const handleCreate = async () => {
    if (!selectedGroupName || !selectedGroupType) return

    let input: CreateWorkflowInput

    if (selectedGroupType === 'video') {
      const group = selectedGroup as VideoPresetGroup
      input = {
        presetType: 'video',
        presetId: group.presetId,
        promptTemplate: '',
        duration: charDuration,
        aspectRatio: charAspectRatio,
        resolution: charResolution,
        provider,
      }
    } else {
      input = {
        presetType: 'character',
        characterPresetName: selectedGroupName,
        promptTemplate: '',
        duration: charDuration,
        aspectRatio: charAspectRatio,
        resolution: charResolution,
        provider,
      }
    }

    const workflow = await createWorkflow(input)
    if (workflow) {
      onWorkflowCreated?.(workflow)
    }
  }

  const isCreateDisabled =
    isLoading ||
    !selectedGroupName ||
    !selectedGroupType ||
    providerConfig[provider].disabled

  const buttonLabel = useMemo(() => {
    if (isLoading) return 'Creating...'
    if (selectedGroup) {
      return `Create Workflow — ${selectedGroup.characterCount} Character${selectedGroup.characterCount !== 1 ? 's' : ''}`
    }
    return 'Create Workflow'
  }, [isLoading, selectedGroup])

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
        {/* Step 1: Select Preset */}
        <div className="grid gap-2">
          <Label>Preset</Label>
          {loadingPresets ? (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Loading presets...
            </div>
          ) : presetError ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
              {presetError}
            </div>
          ) : allGroups.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No presets found. Create presets in Settings first.
            </div>
          ) : (
            <Select value={selectionKey} onChange={handlePresetChange}>
              <SelectItem value="" disabled>
                Select a preset...
              </SelectItem>
              {videoGroups.length > 0 && (
                <optgroup label="Video Presets">
                  {videoGroups.map((group) => (
                    <SelectItem key={`video:${group.name}`} value={`video:${group.name}`}>
                      {group.name} — {group.characterCount} character{group.characterCount !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </optgroup>
              )}
              {charGroups.length > 0 && (
                <optgroup label="Character Presets (Reference Images)">
                  {charGroups.map((group) => (
                    <SelectItem key={`character:${group.name}`} value={`character:${group.name}`}>
                      {group.name} — {group.characterCount} character{group.characterCount !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </optgroup>
              )}
            </Select>
          )}
        </div>

        {/* Preset Info — Video Preset */}
        {selectedGroupType === 'video' && selectedGroup && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border bg-muted/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedGroup.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {selectedGroup.characterCount} character{selectedGroup.characterCount !== 1 ? 's' : ''} queued
              </Badge>
            </div>

          </motion.div>
        )}

        {/* Settings — Video Preset (shown after preset info) */}
        {selectedGroupType === 'video' && selectedGroup && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="grid gap-1.5">
              <Label className="text-xs">Duration</Label>
              <Select value={String(charDuration)} onChange={(e) => setCharDuration(Number(e.target.value))}>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Aspect Ratio</Label>
              <Select value={charAspectRatio} onChange={(e) => setCharAspectRatio(e.target.value)}>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Resolution</Label>
              <Select value={charResolution} onChange={(e) => setCharResolution(e.target.value)}>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="1080p">1080p</SelectItem>
              </Select>
            </div>
          </motion.div>
        )}

        {/* Preset Info — Character Preset (inline config) */}
        {selectedGroupType === 'character' && selectedGroup && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border bg-muted/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedGroup.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {selectedGroup.characterCount} character{selectedGroup.characterCount !== 1 ? 's' : ''} queued
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Duration</Label>
                <Select value={String(charDuration)} onChange={(e) => setCharDuration(Number(e.target.value))}>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Aspect Ratio</Label>
                <Select value={charAspectRatio} onChange={(e) => setCharAspectRatio(e.target.value)}>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Resolution</Label>
                <Select value={charResolution} onChange={(e) => setCharResolution(e.target.value)}>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                </Select>
              </div>
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
            disabled={isCreateDisabled}
          >
            {buttonLabel}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )
}
