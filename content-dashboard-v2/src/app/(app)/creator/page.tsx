'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  StepSource,
  StepRandomize,
  StepAssets,
  StepAmount,
  StepPreset,
  StepPreview,
  StepProgress,
} from '@/components/character-gen'
import type { GenParams } from '@/components/character-gen'
import type { RandomizeConfig } from '@/lib/character-randomizer'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

const STEP_LABELS = [
  'Source',
  'Randomize',
  'Assets',
  'Amount',
  'Preset',
  'Preview',
  'Generate',
]

const DEFAULT_RANDOMIZE: RandomizeConfig = {
  ethnicity: { enabled: false },
  hairstyle: { enabled: false },
  clothes: { enabled: false, description: '' },
}

const DEFAULT_GEN_PARAMS: GenParams = {
  aspect_ratio: '9:16',
  resolution: '1K',
  num_images: 1,
}

export default function CharacterGeneratePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)

  // Form state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [genParams, setGenParams] = useState<GenParams>(DEFAULT_GEN_PARAMS)
  const [randomizeConfig, setRandomizeConfig] = useState<RandomizeConfig>(DEFAULT_RANDOMIZE)
  const [amount, setAmount] = useState(10)
  const [namingMode, setNamingMode] = useState<'random' | 'prefix'>('random')
  const [namePrefix, setNamePrefix] = useState('')
  const [presetName, setPresetName] = useState('')
  const [characterJson, setCharacterJson] = useState<object | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [queueing, setQueueing] = useState(false)

  // Preview state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewCharacterName, setPreviewCharacterName] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const goTo = (target: Step) => {
    setDirection(target > step ? 1 : -1)
    setStep(target)
  }

  const handleGeneratePreview = async () => {
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewImageUrl(null)
    goTo(6)

    try {
      const res = await fetch('/api/character-gen/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceImageUrl: uploadedImageUrl || '',
          randomizeConfig,
          genParams,
          namingMode,
          namePrefix: namePrefix.trim(),
          presetName: presetName.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Preview generation failed')
      }
      const data = await res.json()
      setPreviewImageUrl(data.imageUrl)
      setPreviewCharacterName(data.characterName)
      setCharacterJson(data.characterJson)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Preview generation failed')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleConfirmAndQueue = async () => {
    if (!characterJson) return
    setQueueing(true)
    try {
      const res = await fetch('/api/character-gen/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceImageUrl: uploadedImageUrl || '',
          characterJson,
          randomize: randomizeConfig,
          amount,
          namingMode,
          namePrefix: namePrefix.trim(),
          presetName: presetName.trim(),
          genParams,
        }),
      })
      if (!res.ok) throw new Error('Failed to queue job')
      const data = await res.json()
      setJobId(data.jobId)
      goTo(7)
    } catch (err) {
      console.error('Queue error:', err)
    } finally {
      setQueueing(false)
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (step === 1 ? router.push('/characters') : goTo((step - 1) as Step))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generate Characters</h1>
          <p className="text-sm text-muted-foreground">
            Batch generate AI character profiles from a reference image
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as Step
          const isActive = stepNum === step
          const isDone = stepNum < step
          return (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-colors ${
                    isDone
                      ? 'bg-primary'
                      : isActive
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                />
                <span
                  className={`text-[10px] hidden sm:block ${
                    isActive
                      ? 'text-primary font-medium'
                      : isDone
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Steps */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {step === 1 && (
              <StepSource
                uploadedImageUrl={uploadedImageUrl}
                genParams={genParams}
                onImageUploaded={setUploadedImageUrl}
                onGenParamsChange={setGenParams}
                onNext={() => goTo(2)}
              />
            )}

            {step === 2 && (
              <StepRandomize
                config={randomizeConfig}
                onChange={setRandomizeConfig}
                onNext={() => goTo(3)}
                onBack={() => goTo(1)}
              />
            )}

            {step === 3 && (
              <StepAssets
                onNext={() => goTo(4)}
                onBack={() => goTo(2)}
              />
            )}

            {step === 4 && (
              <StepAmount
                amount={amount}
                namingMode={namingMode}
                namePrefix={namePrefix}
                onAmountChange={setAmount}
                onNamingModeChange={setNamingMode}
                onNamePrefixChange={setNamePrefix}
                onNext={() => goTo(5)}
                onBack={() => goTo(3)}
              />
            )}

            {step === 5 && (
              <StepPreset
                presetName={presetName}
                onPresetNameChange={setPresetName}
                onGeneratePreview={handleGeneratePreview}
                onBack={() => goTo(4)}
              />
            )}

            {step === 6 && (
              <StepPreview
                previewImageUrl={previewImageUrl}
                previewCharacterName={previewCharacterName}
                presetName={presetName}
                loading={previewLoading}
                error={previewError}
                onConfirm={handleConfirmAndQueue}
                onEdit={() => goTo(1)}
              />
            )}

            {step === 7 && jobId && (
              <StepProgress jobId={jobId} onSaved={() => {}} />
            )}

            {step === 7 && !jobId && (
              <div className="text-center py-12 text-muted-foreground">
                {queueing ? 'Queuing job...' : 'No job found.'}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
