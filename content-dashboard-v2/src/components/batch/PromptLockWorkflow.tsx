'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useBatchWorkflow, type BatchWorkflow, type BatchWorkflowPreview } from '@/hooks/useBatchWorkflow'

interface PromptLockWorkflowProps {
  workflowId: string
  onConfirmed?: (workflow: BatchWorkflow) => void
}

const previewStatusStyles: Record<BatchWorkflowPreview['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  generating: { label: 'Generating', className: 'bg-yellow-500/10 text-yellow-500' },
  completed: { label: 'Ready', className: 'bg-emerald-500/10 text-emerald-500' },
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
  const [isEditing, setIsEditing] = useState(false)
  const [iterationCount, setIterationCount] = useState(0)

  const previewCharacter = workflow?.previewCharacter
  const totalCharacters = workflow?.totalItems ?? 0
  const preview = previews[0] ?? null
  const previewStyle = preview ? previewStatusStyles[preview.status] : null

  useEffect(() => {
    if (workflow?.basePrompt && !prompt) {
      setPrompt(workflow.basePrompt)
    }
  }, [workflow?.basePrompt, prompt])

  const handleGeneratePreview = async () => {
    const result = await generatePreviews(workflowId, prompt)
    if (result) {
      setIterationCount((c) => c + 1)
      setIsEditing(false)
    }
  }

  const handleConfirmAndBatch = async () => {
    const result = await confirmWorkflow({ confirmedPrompt: prompt })
    if (result) {
      onConfirmed?.(result)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Prompt-Lock Workflow</CardTitle>
            {previewCharacter && (
              <p className="text-sm text-muted-foreground mt-1">
                Testing with: <span className="font-medium text-foreground">{previewCharacter.name}</span>
                {' '}(first of {totalCharacters} characters)
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] uppercase',
              status === 'previewing' ? 'text-yellow-500' : 'text-muted-foreground'
            )}
          >
            {iterationCount > 0 ? `Iteration ${iterationCount}` : status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Prompt Editor */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Prompt</div>
            {preview && !isEditing && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setIsEditing(true)}
              >
                Edit Prompt
              </button>
            )}
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={cn('min-h-[100px] transition-colors', !isEditing && preview && 'bg-muted/30')}
            readOnly={!isEditing && !!preview}
          />
        </div>

        {/* No preview yet — generate first */}
        {!preview && (
          <Button
            type="button"
            variant="default"
            onClick={handleGeneratePreview}
            disabled={isLoading || !prompt.trim()}
            className="w-full"
          >
            {isLoading ? 'Generating Preview...' : 'Generate Preview Video'}
          </Button>
        )}

        {/* Preview display */}
        {preview && (
          <div className="rounded-lg border overflow-hidden">
            <div className="relative bg-muted/40 flex items-center justify-center" style={{ minHeight: '200px' }}>
              {preview.videoUrl && preview.status === 'completed' ? (
                <video
                  src={preview.videoUrl}
                  className="max-h-[500px] w-auto rounded"
                  muted
                  playsInline
                  loop
                  autoPlay
                  controls
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {preview.status === 'generating' ? (
                    <span className="animate-pulse">Generating preview video...</span>
                  ) : preview.status === 'failed' ? (
                    <span className="text-red-500">Preview generation failed</span>
                  ) : (
                    'Waiting for preview...'
                  )}
                </div>
              )}
            </div>
            {previewStyle && (
              <div className="flex items-center justify-between p-3">
                <span className="text-xs text-muted-foreground">Preview for {previewCharacter?.name}</span>
                <Badge variant="outline" className={cn('text-[10px] uppercase', previewStyle.className)}>
                  {previewStyle.label}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Action buttons after preview */}
        {preview && preview.status === 'completed' && (
          <div className="grid gap-2">
            {isEditing ? (
              <Button
                type="button"
                variant="default"
                onClick={handleGeneratePreview}
                disabled={isLoading || !prompt.trim()}
                className="w-full"
              >
                {isLoading ? 'Regenerating...' : 'Regenerate Preview with Updated Prompt'}
              </Button>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  ✏️ Edit Prompt
                </Button>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleConfirmAndBatch}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Starting Batch...' : `✓ Confirm & Batch All ${totalCharacters} Characters`}
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* Failed preview — retry */}
        {preview && preview.status === 'failed' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGeneratePreview}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Retrying...' : 'Retry Preview Generation'}
          </Button>
        )}

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
