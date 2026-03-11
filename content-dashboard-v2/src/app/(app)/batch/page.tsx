'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BatchSetup, SeedLockWorkflow, PromptLockWorkflow, BatchProgress } from '@/components/batch'
import type { BatchWorkflow } from '@/hooks/useBatchWorkflow'

type Step = 'setup' | 'workflow' | 'progress'

function statusToStep(status: string, urlStep?: string | null): Step {
  const mapped: Step =
    status === 'setup' || status === 'previewing' ? 'workflow' :
    status === 'generating' || status === 'completed' ? 'progress' :
    'setup'

  if (urlStep && (urlStep === 'setup' || urlStep === 'workflow' || urlStep === 'progress')) {
    // Allow URL step override only if it's valid given the workflow exists
    return urlStep as Step
  }

  return mapped
}

export default function BatchWorkflowPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('setup')
  const [workflow, setWorkflow] = useState<BatchWorkflow | null>(null)
  const [restoring, setRestoring] = useState(false)

  const updateUrl = useCallback((newStep: Step, newWorkflowId?: string | null) => {
    const params = new URLSearchParams()
    if (newWorkflowId) {
      params.set('workflowId', newWorkflowId)
      params.set('step', newStep)
    }
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '/batch')
  }, [router])

  // Restore state from URL on mount
  useEffect(() => {
    const workflowId = searchParams.get('workflowId')
    const urlStep = searchParams.get('step')

    if (!workflowId) return

    setRestoring(true)
    fetch(`/api/batch-workflow/${workflowId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((wf: BatchWorkflow) => {
        setWorkflow(wf)
        setStep(statusToStep(wf.status, urlStep))
      })
      .catch(() => {
        // Workflow not found — clear URL and go to setup
        router.replace('/batch')
        setStep('setup')
      })
      .finally(() => setRestoring(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleWorkflowCreated = (wf: BatchWorkflow) => {
    setWorkflow(wf)
    setStep('workflow')
    updateUrl('workflow', wf.id)
  }

  const handleConfirmed = (wf: BatchWorkflow) => {
    setWorkflow(wf)
    setStep('progress')
    updateUrl('progress', wf.id)
  }

  const handleReset = () => {
    setWorkflow(null)
    setStep('setup')
    updateUrl('setup')
  }

  if (restoring) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <p className="text-sm text-muted-foreground">Restoring...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Batch Video Generation</h1>
          <p className="text-sm text-muted-foreground">
            Select a preset, preview with the first character, then generate for all.
          </p>
        </div>
        {step !== 'setup' && (
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Start Over
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <BatchSetup onWorkflowCreated={handleWorkflowCreated} />
          </motion.div>
        )}

        {step === 'workflow' && workflow && (
          <motion.div key="workflow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {workflow.workflowType === 'seed_lock' ? (
              <SeedLockWorkflow workflowId={workflow.id} onConfirmed={handleConfirmed} />
            ) : (
              <PromptLockWorkflow workflowId={workflow.id} onConfirmed={handleConfirmed} />
            )}
          </motion.div>
        )}

        {step === 'progress' && workflow && (
          <motion.div key="progress" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <BatchProgress workflowId={workflow.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
