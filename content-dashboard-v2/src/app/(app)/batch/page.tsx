'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BatchSetup, SeedLockWorkflow, PromptLockWorkflow, BatchProgress } from '@/components/batch'
import type { BatchWorkflow } from '@/hooks/useBatchWorkflow'

type Step = 'setup' | 'workflow' | 'progress'

export default function BatchWorkflowPage() {
  const [step, setStep] = useState<Step>('setup')
  const [workflow, setWorkflow] = useState<BatchWorkflow | null>(null)

  const handleWorkflowCreated = (wf: BatchWorkflow) => {
    setWorkflow(wf)
    setStep('workflow')
  }

  const handleConfirmed = (wf: BatchWorkflow) => {
    setWorkflow(wf)
    setStep('progress')
  }

  const handleReset = () => {
    setWorkflow(null)
    setStep('setup')
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Batch Video Generation</h1>
          <p className="text-sm text-muted-foreground">
            Generate videos for multiple characters with locked seeds or prompts.
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
