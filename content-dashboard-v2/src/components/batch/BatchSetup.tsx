'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useBatchWorkflow, type BatchWorkflow, type BatchWorkflowProvider, type BatchWorkflowType } from '@/hooks/useBatchWorkflow'

interface BatchSetupProps {
  onWorkflowCreated?: (workflow: BatchWorkflow) => void
}

const providerConfig: Record<BatchWorkflowProvider, { label: string; workflowType: BatchWorkflowType; disabled?: boolean }> = {
  kling: { label: 'Kling', workflowType: 'seed_lock' },
  seedance: { label: 'Seedance', workflowType: 'prompt_lock' },
  veo: { label: 'Veo', workflowType: 'prompt_lock', disabled: true },
}

export function BatchSetup({ onWorkflowCreated }: BatchSetupProps) {
  const { createWorkflow, isLoading, error } = useBatchWorkflow()
  const [name, setName] = useState('')
  const [provider, setProvider] = useState<BatchWorkflowProvider>('kling')
  const [basePrompt, setBasePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [duration, setDuration] = useState('5')
  const [resolution, setResolution] = useState('720p')

  const workflowType = useMemo(() => providerConfig[provider].workflowType, [provider])

  const handleCreate = async () => {
    const workflow = await createWorkflow({
      name: name.trim() || undefined,
      provider,
      workflowType,
      basePrompt,
      aspectRatio,
      duration: Number(duration),
      resolution,
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
          <Badge variant="outline" className={cn('text-[10px] uppercase', workflowType === 'seed_lock' ? 'text-emerald-500' : 'text-blue-500')}>
            {workflowType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="workflow-name">Workflow Name (optional)</Label>
          <Input id="workflow-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Fall campaign batch" />
        </div>

        <div className="grid gap-2">
          <Label>Provider</Label>
          <Select value={provider} onChange={(e) => setProvider(e.target.value as BatchWorkflowProvider)}>
            {Object.entries(providerConfig).map(([key, config]) => (
              <SelectItem key={key} value={key} disabled={!!config.disabled}>
                {config.label}{config.disabled ? ' (coming soon)' : ''}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="base-prompt">Base Prompt</Label>
          <Textarea id="base-prompt" value={basePrompt} onChange={(e) => setBasePrompt(e.target.value)} placeholder="Describe the base prompt for the batch" className="min-h-[120px]" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              <SelectItem value="9:16">9:16</SelectItem>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="1:1">1:1</SelectItem>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Duration</Label>
            <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <SelectItem value="5">5s</SelectItem>
              <SelectItem value="10">10s</SelectItem>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Resolution</Label>
            <Select value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <SelectItem value="480p">480p</SelectItem>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
            </Select>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</div>
        )}

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button type="button" variant="default" className="w-full" onClick={handleCreate} disabled={isLoading || !basePrompt.trim() || providerConfig[provider].disabled}>
            {isLoading ? 'Creating...' : 'Create Workflow'}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )
}
