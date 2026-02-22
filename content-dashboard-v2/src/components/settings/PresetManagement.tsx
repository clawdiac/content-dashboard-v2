"use client"

import { useState, useEffect } from "react"
import { useConfigStore } from "@/store/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, X, Check, Image as ImageIcon } from "lucide-react"
import type { ImagePreset } from "@/types"

interface PresetForm {
  name: string
  displayName: string
  promptTemplate: string
  negativePrompt: string
  thumbnailUrl: string
  width: number
  height: number
  steps: number
  cfg: number
  sampler: string
  scheduler: string
}

const defaultForm: PresetForm = { name: "", displayName: "", promptTemplate: "", negativePrompt: "", thumbnailUrl: "", width: 1024, height: 1024, steps: 30, cfg: 7, sampler: "euler", scheduler: "normal" }

export function PresetManagement() {
  const { imagePresets, fetchPresets } = useConfigStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PresetForm>(defaultForm)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchPresets() }, [fetchPresets])

  const validate = (): string | null => {
    if (!form.name.trim()) return "Name is required"
    if (!form.displayName.trim()) return "Display name is required"
    if (!form.promptTemplate.trim()) return "Prompt template is required"
    if (form.width < 64 || form.width > 4096) return "Width must be 64-4096"
    if (form.height < 64 || form.height > 4096) return "Height must be 64-4096"
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError(null)
    try {
      const body = { ...form, name: form.name.trim(), displayName: form.displayName.trim(), promptTemplate: form.promptTemplate.trim(), negativePrompt: form.negativePrompt.trim() || undefined, thumbnailUrl: form.thumbnailUrl.trim() || undefined }
      const url = editing ? `/api/presets/${editing}` : "/api/presets"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      await fetchPresets()
      cancel()
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/presets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      await fetchPresets()
      setDeleting(null)
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete") }
    finally { setSaving(false) }
  }

  const startEdit = (p: ImagePreset) => {
    setEditing(p.id); setCreating(false); setError(null)
    setForm({ name: p.name, displayName: p.displayName, promptTemplate: p.promptTemplate, negativePrompt: p.negativePrompt ?? "", thumbnailUrl: p.thumbnailUrl ?? "", width: p.width, height: p.height, steps: p.steps, cfg: p.cfg, sampler: p.sampler, scheduler: p.scheduler })
  }

  const cancel = () => { setEditing(null); setCreating(false); setForm(defaultForm); setError(null) }
  const isEditing = editing !== null || creating

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Image Presets</h3>
          <p className="text-sm text-muted-foreground">{imagePresets.length} preset{imagePresets.length !== 1 ? "s" : ""}</p>
        </div>
        {!isEditing && <Button size="sm" onClick={() => { setCreating(true); setForm(defaultForm); setError(null) }}><Plus className="h-4 w-4 mr-1" /> Add Preset</Button>}
      </div>

      {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

      {isEditing && (
        <Card className="p-6 space-y-4 border-primary/30">
          <h4 className="font-medium">{creating ? "New Preset" : "Edit Preset"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="preset-name">Name *</Label><Input id="preset-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={50} aria-required /></div>
            <div><Label htmlFor="preset-display">Display Name *</Label><Input id="preset-display" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} maxLength={100} aria-required /></div>
            <div className="md:col-span-2"><Label htmlFor="preset-prompt">Prompt Template *</Label><textarea id="preset-prompt" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={form.promptTemplate} onChange={e => setForm(f => ({ ...f, promptTemplate: e.target.value }))} aria-required /></div>
            <div className="md:col-span-2"><Label htmlFor="preset-neg">Negative Prompt</Label><textarea id="preset-neg" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.negativePrompt} onChange={e => setForm(f => ({ ...f, negativePrompt: e.target.value }))} /></div>
            <div><Label htmlFor="preset-thumb">Thumbnail URL</Label><Input id="preset-thumb" value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="preset-w">Width</Label><Input id="preset-w" type="number" value={form.width} onChange={e => setForm(f => ({ ...f, width: +e.target.value }))} /></div>
              <div><Label htmlFor="preset-h">Height</Label><Input id="preset-h" type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: +e.target.value }))} /></div>
            </div>
            <div><Label htmlFor="preset-steps">Steps</Label><Input id="preset-steps" type="number" value={form.steps} onChange={e => setForm(f => ({ ...f, steps: +e.target.value }))} /></div>
            <div><Label htmlFor="preset-cfg">CFG</Label><Input id="preset-cfg" type="number" step={0.5} value={form.cfg} onChange={e => setForm(f => ({ ...f, cfg: +e.target.value }))} /></div>
            <div><Label htmlFor="preset-sampler">Sampler</Label><Input id="preset-sampler" value={form.sampler} onChange={e => setForm(f => ({ ...f, sampler: e.target.value }))} /></div>
            <div><Label htmlFor="preset-sched">Scheduler</Label><Input id="preset-sched" value={form.scheduler} onChange={e => setForm(f => ({ ...f, scheduler: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm"><Check className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
            <Button variant="ghost" onClick={cancel} size="sm"><X className="h-4 w-4 mr-1" />Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {imagePresets.length === 0 && !creating && <div className="text-center py-12 text-muted-foreground">No image presets yet.</div>}
        {imagePresets.map(preset => (
          <Card key={preset.id} className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {preset.thumbnailUrl ? <img src={preset.thumbnailUrl} alt={preset.displayName} className="h-10 w-10 object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{preset.displayName}</div>
              <div className="text-xs text-muted-foreground truncate">{preset.width}×{preset.height} · {preset.steps} steps · CFG {preset.cfg}</div>
            </div>
            {deleting === preset.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Delete?</span>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(preset.id)} disabled={saving}>Yes</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(null)}>No</Button>
              </div>
            ) : (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(preset)} aria-label={`Edit ${preset.displayName}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(preset.id)} aria-label={`Delete ${preset.displayName}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
