'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useBatchWorkflow,
  type BatchWorkflow,
  type BatchWorkflowCharacter,
  type BatchWorkflowPreview,
} from '@/hooks/useBatchWorkflow'

interface PromptLockWorkflowProps {
  workflowId: string
  onConfirmed?: (workflow: BatchWorkflow) => void
}

const previewStatusStyles: Record<BatchWorkflowPreview['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  generating: { label: 'Generating', className: 'bg-yellow-500/10 text-yellow-500' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-500' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-500' },
}

export function PromptLockWorkflow({ workflowId, onConfirmed }: PromptLockWorkflowProps) {
  const {
    workflow,
    previews,
    status,
    error,
    isLoading,
    generatePreviews,
    confirmWorkflow,
  } = useBatchWorkflow(workflowId)
  const [prompt, setPrompt] = useState('')
  const [characters, setCharacters] = useState<BatchWorkflowCharacter[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingCharacters, setLoadingCharacters] = useState(false)
  const [characterError, setCharacterError] = useState<string | null>(null)

  useEffect(() => {
    if (workflow?.basePrompt) {
      setPrompt(workflow.basePrompt)
    }
  }, [workflow?.basePrompt])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoadingCharacters(true)
      setCharacterError(null)
      try {
        const res = await fetch('/api/characters', { signal: controller.signal })
        if (!res.ok) {
          throw new Error('Failed to load characters')
        }
        const data = await res.json()
        setCharacters(data)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setCharacterError(err instanceof Error ? err.message : 'Failed to load characters')
      } finally {
        setLoadingCharacters(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const selectedCount = selectedIds.length
  const preview = previews[0]
  const previewStyle = preview ? previewStatusStyles[preview.status] : null

  const toggleCharacter = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleConfirm = async () => {
    if (selectedCount === 0) return
    const workflowData = await confirmWorkflow({
      workflowId,
      characterIds: selectedIds,
    })
    if (workflowData) {
      onConfirmed?.(workflowData)
    }
  }

  const characterSummary = useMemo(() => {
    if (loadingCharacters) return 'Loading characters...'
    if (characterError) return 'Unable to load characters'
    if (characters.length === 0) return 'No characters available'
    return `${selectedCount} of ${characters.length} selected`
  }, [loadingCharacters, characterError, characters.length, selectedCount])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Prompt-Lock Workflow</CardTitle>
          <Badge variant="outline" className={cn('text-[10px] uppercase', status === 'previewing' ? 'text-yellow-500' : 'text-muted-foreground')}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Base Prompt</div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            onClick={() => generatePreviews(workflowId)}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Preview'}
          </Button>
          <div className="text-xs text-muted-foreground">Use the preview to validate the prompt before batch run.</div>
        </div>

        <div className="rounded-lg border p-3">
          {preview ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Latest Preview</div>
                {previewStyle && (
                  <Badge variant="outline" className={cn('text-[10px] uppercase', previewStyle.className)}>
                    {previewStyle.label}
                  </Badge>
                )}
              </div>
              <div className="aspect-video overflow-hidden rounded-md bg-muted/40">
                {preview.videoUrl && preview.status === 'completed' ? (
                  <video
                    src={preview.videoUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    {preview.status === 'generating' ? 'Generating preview...' : 'No preview video yet'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No preview generated yet.</div>
          )}
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Characters</div>
            <div className="text-xs text-muted-foreground">{characterSummary}</div>
          </div>

          {characterError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
              {characterError}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {characters.map((character) => {
              const isSelected = selectedIds.includes(character.id)
              return (
                <label
                  key={character.id}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
                    isSelected ? 'border-primary/60 bg-primary/5' : 'border-border hover:bg-muted/40'
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={isSelected}
                    onChange={() => toggleCharacter(character.id)}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{character.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {character.description || 'No description'}
                    </div>
                  </div>
                </label>
              )
            })}
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
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isLoading}
          >
            {isLoading ? 'Starting...' : `Start Batch for ${selectedCount} Characters`}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )
}
