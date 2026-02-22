"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CharacterSelect } from "@/components/generation/CharacterSelect"
import { PresetSelect } from "@/components/generation/PresetSelect"
import { ModelConfigPanel } from "@/components/generation/ModelConfigPanel"
import ReferenceImagesManager from "@/components/generation/ReferenceImagesManager"
import type { ReferenceImage } from "@/components/generation/ReferenceImagesManager"
import { BatchModeSelector } from "@/components/generate/BatchModeSelector"
import {
  MODEL_REGISTRY,
  MODEL_DEFAULTS,
  estimateCost,
  type ModelConfig,
  type ModelId,
  type GenerationRequest,
} from "@/lib/models"
import type { BatchType } from "@/types"

const MODEL_OPTIONS = Object.values(MODEL_REGISTRY).map((m) => ({
  value: m.id,
  label: `${m.name} (${m.type === "image" ? "Image" : "Video"})`,
}))

type GenerationMode = "single" | "batch"

export function GenerationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Mode toggle
  const [generationMode, setGenerationMode] = useState<GenerationMode>("single")
  const [batchType, setBatchType] = useState<BatchType>("image")

  // Batch config
  const [batchName, setBatchName] = useState("")
  const [batchItemCount, setBatchItemCount] = useState(3)
  const [batchCharacterIds, setBatchCharacterIds] = useState<string[]>([])

  // Shared state
  const [modelId, setModelId] = useState<ModelId>("nano_banana_pro")
  const [modelConfig, setModelConfig] = useState<ModelConfig>({ ...MODEL_DEFAULTS.nano_banana_pro })
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [showNegative, setShowNegative] = useState(false)
  const [characterId, setCharacterId] = useState("")
  const [presetId, setPresetId] = useState("")
  const [presetImageUrl, setPresetImageUrl] = useState<string | null>(null)
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])

  // SSE progress for batch
  const [batchProgress, setBatchProgress] = useState<{
    batchId: string
    total: number
    completed: number
    failed: number
  } | null>(null)

  const spec = MODEL_REGISTRY[modelId]

  // Cost estimation (dynamic based on selected params)
  const costEstimate = useMemo(() => {
    const unitCost = estimateCost(modelId, modelConfig)
    if (unitCost === 0) return spec.costEstimate
    if (generationMode === "single") return `~$${unitCost.toFixed(2)}`
    const charCount = batchCharacterIds.length || 1
    const totalItems = batchItemCount * charCount
    const totalCost = (unitCost * totalItems).toFixed(2)
    return `${totalItems} items × $${unitCost.toFixed(2)} = ~$${totalCost}`
  }, [generationMode, batchItemCount, batchCharacterIds.length, modelId, modelConfig, spec.costEstimate])

  const handleModelChange = (newModelId: ModelId) => {
    setModelId(newModelId)
    setModelConfig({ ...MODEL_DEFAULTS[newModelId] })
    setCharacterId("")
    setPresetId("")
    setPresetImageUrl(null)
  }

  const handlePresetSelect = (newPresetId: string, imageUrl: string) => {
    setPresetId(newPresetId)
    const fullUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `${window.location.origin}${imageUrl}`
    // Store preset image separately — NOT in referenceImages
    setPresetImageUrl(fullUrl)
  }

  const subscribeToBatchSSE = (batchId: string) => {
    const eventSource = new EventSource(`/api/batch/${batchId}/events`)

    eventSource.addEventListener("job:completed", () => {
      setBatchProgress((prev) =>
        prev ? { ...prev, completed: prev.completed + 1 } : prev
      )
    })

    eventSource.addEventListener("job:failed", () => {
      setBatchProgress((prev) =>
        prev ? { ...prev, failed: prev.failed + 1 } : prev
      )
    })

    eventSource.addEventListener("batch:completed", () => {
      eventSource.close()
      setLoading(false)
      router.refresh()
    })

    eventSource.addEventListener("error", () => {
      eventSource.close()
      setLoading(false)
    })
  }

  const handleSubmitSingle = async () => {
    // Manual reference images only (no preset images here)
    const manualRefImages = referenceImages
      .filter((img) => img.source !== "preset")
      .map((img, idx) => ({
        url: img.url,
        source: img.source,
        order: idx,
        mimeType: "image/jpeg",
      }))

    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        negativePrompt: showNegative ? negativePrompt : null,
        modelConfig,
        presetImageUrl: presetImageUrl || null,
        referenceImages: manualRefImages,
        characterId: characterId || null,
        presetId: presetId || null,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Generation failed: ${response.status}`)
    }
  }

  const handleSubmitBatch = async () => {
    const charIds = batchCharacterIds.length > 0 ? batchCharacterIds : (characterId ? [characterId] : [])

    // Build items array: one item per character × batchItemCount
    const items: Array<{
      title: string
      prompt: string
      negativePrompt?: string
      characterId?: string
      presetId?: string
      presetImageUrl?: string
      manualReferenceImages?: string[]
    }> = []

    // Manual reference images only (no preset)
    const manualRefImages = referenceImages
      .filter((img) => img.source !== "preset")
      .map((img) => img.url)

    const effectiveCharIds = charIds.length > 0 ? charIds : [""]

    for (const cId of effectiveCharIds) {
      for (let i = 0; i < batchItemCount; i++) {
        items.push({
          title: `${batchName || "Batch"} - ${cId ? `Char ${cId.slice(0, 6)}` : "Item"} #${i + 1}`,
          prompt,
          negativePrompt: showNegative ? negativePrompt : undefined,
          characterId: cId || undefined,
          presetId: presetId || undefined,
          presetImageUrl: presetImageUrl || undefined,
          manualReferenceImages: manualRefImages.length > 0 ? manualRefImages : undefined,
        })
      }
    }

    const response = await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: batchName || `Batch ${new Date().toISOString().slice(0, 16)}`,
        items,
        modelConfig,
        characterId: characterId || undefined,
        presetId: presetId || undefined,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Batch creation failed: ${response.status}`)
    }

    const data = await response.json()

    // Start SSE progress tracking
    setBatchProgress({
      batchId: data.batchId,
      total: data.totalItems,
      completed: 0,
      failed: 0,
    })
    subscribeToBatchSSE(data.batchId)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      if (generationMode === "batch") {
        await handleSubmitBatch()
        // Don't reset loading here — SSE will handle it
      } else {
        await handleSubmitSingle()
        setPrompt("")
        setNegativePrompt("")
        setLoading(false)
        router.refresh()
      }
    } catch (err) {
      console.error("Generation error:", err)
      alert(err instanceof Error ? err.message : "Generation failed")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Mode</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGenerationMode("single")}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                generationMode === "single"
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <div className="font-medium">Single</div>
              <div className="text-[10px] text-muted-foreground">Generate one item</div>
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode("batch")}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                generationMode === "batch"
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <div className="font-medium">Batch</div>
              <div className="text-[10px] text-muted-foreground">Generate multiple items</div>
            </button>
          </div>

          {generationMode === "batch" && (
            <div className="grid gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Batch Type</Label>
                <BatchModeSelector value={batchType} onChange={setBatchType} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="batchName">Batch Name</Label>
                <Input
                  id="batchName"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Summer Campaign"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="batchItemCount">
                  Items per character
                </Label>
                <Input
                  id="batchItemCount"
                  type="number"
                  min={1}
                  max={20}
                  value={batchItemCount}
                  onChange={(e) => setBatchItemCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generator & Character */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Input</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="generator">Generator</Label>
            <Select
              id="generator"
              value={modelId}
              onChange={(e) => handleModelChange(e.target.value as ModelId)}
            >
              {MODEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="character">Character {generationMode === "batch" ? "" : "(optional)"}</Label>
            <CharacterSelect
              id="character"
              value={characterId}
              onChange={(value) => {
                setCharacterId(value)
                setPresetId("")
                setPresetImageUrl(null)
              }}
              placeholder="Select a character"
            />
          </div>

          {characterId && (
            <div className="grid gap-2">
              <Label htmlFor="preset">Character Preset</Label>
              <PresetSelect
                id="preset"
                characterId={characterId}
                value={presetId}
                onChange={handlePresetSelect}
                placeholder="Select a preset"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preset Image Preview */}
      {presetImageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preset Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <img
                src={presetImageUrl}
                alt="Preset"
                className="h-16 w-16 shrink-0 rounded-md border border-border object-cover"
              />
              <span className="text-sm text-muted-foreground">
                This image will be used as the character reference for generation.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Reference Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Additional Reference Images</span>
            <span className="text-xs font-normal text-muted-foreground">
              {referenceImages.length}/5 images
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReferenceImagesManager
            images={referenceImages}
            onChange={setReferenceImages}
            maxImages={5}
          />
        </CardContent>
      </Card>

      {/* Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the scene, camera, and lighting..."
              required
            />
          </div>

          {modelId !== "kling" && (
            <>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="text-sm text-muted-foreground">Negative prompt</span>
                <button
                  type="button"
                  onClick={() => setShowNegative((p) => !p)}
                  className="text-sm font-medium text-foreground"
                >
                  {showNegative ? "Remove" : "Add"}
                </button>
              </div>
              {showNegative && (
                <div className="grid gap-2">
                  <Label htmlFor="negative">Negative Prompt</Label>
                  <Textarea
                    id="negative"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Blur, low-res, artifacts..."
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle>
            {spec.type === "video" ? "Video Settings" : "Image Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ModelConfigPanel
            modelId={modelId}
            config={modelConfig}
            onChange={setModelConfig}
          />
        </CardContent>
      </Card>

      {/* Batch Progress */}
      {batchProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {batchProgress.completed + batchProgress.failed} / {batchProgress.total} items
                </span>
                <span className="text-muted-foreground">
                  {batchProgress.failed > 0 && (
                    <span className="text-destructive">{batchProgress.failed} failed · </span>
                  )}
                  {batchProgress.completed} completed
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${((batchProgress.completed + batchProgress.failed) / batchProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Summary + Submit */}
      <div className="sticky bottom-0 z-10 rounded-lg border border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {referenceImages.length > 0 && (
            <span>{referenceImages.length} ref image{referenceImages.length > 1 ? "s" : ""} · </span>
          )}
          <span className="font-semibold text-foreground">
            {costEstimate}
          </span>
        </div>
        <Button type="submit" disabled={loading}>
          {loading
            ? generationMode === "batch"
              ? "Creating batch..."
              : "Generating..."
            : generationMode === "batch"
              ? `Generate Batch (${batchItemCount * (batchCharacterIds.length || 1)} items)`
              : "Generate"}
        </Button>
      </div>
    </form>
  )
}
