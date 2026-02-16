"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CharacterSelect } from "@/components/generation/CharacterSelect"
import { ReferenceSelect } from "@/components/generation/ReferenceSelect"

const MODEL_OPTIONS = [
  { value: "nano_banana_pro", label: "Nano Banana Pro" },
  { value: "kling", label: "Kling" },
  { value: "seedance", label: "Seedance" },
]

export function GenerationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNegative, setShowNegative] = useState(false)

  const [form, setForm] = useState({
    title: "",
    prompt: "",
    negativePrompt: "",
    generator: "nano_banana_pro",
    characterId: "",
    referenceImageId: "",
    steps: 30,
    guidance: 7,
    seed: "",
    width: 1024,
    height: 1024,
    outputs: 1,
  })

  const updateField = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const generationParams = {
      steps: Number(form.steps),
      guidance: Number(form.guidance),
      seed: form.seed ? String(form.seed) : null,
      width: Number(form.width),
      height: Number(form.height),
      outputs: Number(form.outputs),
      characterId: form.characterId || null,
      referenceImageId: form.referenceImageId || null,
    }

    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        prompt: form.prompt,
        negativePrompt: showNegative ? form.negativePrompt : null,
        generator: form.generator,
        generationParams,
      }),
    })

    setForm((prev) => ({
      ...prev,
      title: "",
      prompt: "",
      negativePrompt: "",
      seed: "",
    }))
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generation Input</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Hyperrealist street portrait"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Select
              id="model"
              value={form.generator}
              onChange={(event) => updateField("generator", event.target.value)}
            >
              {MODEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="character">Character</Label>
            <CharacterSelect
              id="character"
              value={form.characterId}
              onChange={(value) => updateField("characterId", value)}
              placeholder="Select a character"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reference">Reference</Label>
            <ReferenceSelect
              id="reference"
              value={form.referenceImageId}
              onChange={(value) => updateField("referenceImageId", value)}
              placeholder="Select a reference"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={form.prompt}
              onChange={(event) => updateField("prompt", event.target.value)}
              placeholder="Describe the scene, camera, and lighting..."
              required
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
            <div className="text-sm text-muted-foreground">
              Add negative prompt
            </div>
            <button
              type="button"
              onClick={() => setShowNegative((prev) => !prev)}
              className="text-sm font-medium text-foreground"
            >
              {showNegative ? "Remove" : "Add"}
            </button>
          </div>
          {showNegative ? (
            <div className="grid gap-2">
              <Label htmlFor="negative">Negative Prompt</Label>
              <Textarea
                id="negative"
                value={form.negativePrompt}
                onChange={(event) =>
                  updateField("negativePrompt", event.target.value)
                }
                placeholder="Blur, low-res, artifacts..."
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation Params</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="steps">Steps</Label>
            <Input
              id="steps"
              type="number"
              min={1}
              value={form.steps}
              onChange={(event) => updateField("steps", Number(event.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guidance">Guidance</Label>
            <Input
              id="guidance"
              type="number"
              min={1}
              step={0.5}
              value={form.guidance}
              onChange={(event) =>
                updateField("guidance", Number(event.target.value))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="seed">Seed</Label>
            <Input
              id="seed"
              value={form.seed}
              onChange={(event) => updateField("seed", event.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              min={256}
              step={64}
              value={form.width}
              onChange={(event) => updateField("width", Number(event.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              min={256}
              step={64}
              value={form.height}
              onChange={(event) => updateField("height", Number(event.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="outputs">Outputs</Label>
            <Input
              id="outputs"
              type="number"
              min={1}
              max={8}
              value={form.outputs}
              onChange={(event) =>
                updateField("outputs", Number(event.target.value))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Queuing..." : "Generate"}
        </Button>
      </div>
    </form>
  )
}
