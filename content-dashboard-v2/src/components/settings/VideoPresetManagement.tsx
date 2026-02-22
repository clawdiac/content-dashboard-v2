"use client"

import { useState, useEffect } from "react"
import { useConfigStore } from "@/store/config"
import { presetApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, X, Check, Clapperboard } from "lucide-react"
import type { VideoPreset } from "@/types"

interface VPForm {
  name: string
  displayName: string
  model: string
  duration: number
  motionPrompt: string
  referenceImageUrl: string
  thumbnailUrl: string
  fps: number
  width: number
  height: number
}

const defaultForm: VPForm = { name: "", displayName: "", model: "seedance", duration: 5, motionPrompt: "", referenceImageUrl: "", thumbnailUrl: "", fps: 24, width: 1280, height: 720 }

export function VideoPresetManagement() {
  const { videoPresets, fetchPresets } = useConfigStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<VPForm>(defaultForm)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchPresets() }, [fetchPresets])

  const validate = (): string | null => {
    if (!form.name.trim()) return "Name is required"
    if (!form.displayName.trim()) return "Display name is required"
    if (!form.model.trim()) return "Model is required"
    if (form.duration < 1 || form.duration > 30) return "Duration must be 1-30s"
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError(null)
    try {
      const data = { name: form.name.trim(), displayName: form.displayName.trim(), model: form.model, duration: form.duration, motionPrompt: form.motionPrompt.trim() || undefined, referenceImageUrl: form.referenceImageUrl.trim() || undefined, thumbnailUrl: form.thumbnailUrl.trim() || undefined, fps: form.fps, width: form.width, height: form.height }
      if (editing) { await presetApi.updateVideo(editing, data) }
      else { await presetApi.createVideo(data) }
      await fetchPresets()
      cancel()
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try { await presetApi.deleteVideo(id); await fetchPresets(); setDeleting(null) }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to delete") }
    finally { setSaving(false) }
  }

  const startEdit = (p: VideoPreset) => {
    setEditing(p.id); setCreating(false); setError(null)
    setForm({ name: p.name, displayName: p.displayName, model: p.model, duration: p.duration, motionPrompt: p.motionPrompt ?? "", referenceImageUrl: p.referenceImageUrl ?? "", thumbnailUrl: p.thumbnailUrl ?? "", fps: p.fps, width: p.width, height: p.height })
  }

  const cancel = () => { setEditing(null); setCreating(false); setForm(defaultForm); setError(null) }
  const isEditing = editing !== null || creating

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Clapperboard className="h-5 w-5" /> Video Presets</h3>
          <p className="text-sm text-muted-foreground">{videoPresets.length} preset{videoPresets.length !== 1 ? "s" : ""}</p>
        </div>
        {!isEditing && <Button size="sm" onClick={() => { setCreating(true); setForm(defaultForm); setError(null) }}><Plus className="h-4 w-4 mr-1" /> Add Preset</Button>}
      </div>

      {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

      {isEditing && (
        <Card className="p-6 space-y-4 border-primary/30">
          <h4 className="font-medium">{creating ? "New Video Preset" : "Edit Video Preset"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="vp-name">Name *</Label><Input id="vp-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={50} aria-required /></div>
            <div><Label htmlFor="vp-display">Display Name *</Label><Input id="vp-display" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} maxLength={100} aria-required /></div>
            <div>
              <Label htmlFor="vp-model">Model *</Label>
              <select id="vp-model" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} aria-required>
                <option value="seedance">Seedance</option>
                <option value="kling">Kling</option>
              </select>
            </div>
            <div><Label htmlFor="vp-dur">Duration (seconds)</Label><Input id="vp-dur" type="number" min={1} max={30} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} /></div>
            <div><Label htmlFor="vp-fps">FPS</Label><Input id="vp-fps" type="number" value={form.fps} onChange={e => setForm(f => ({ ...f, fps: +e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="vp-w">Width</Label><Input id="vp-w" type="number" value={form.width} onChange={e => setForm(f => ({ ...f, width: +e.target.value }))} /></div>
              <div><Label htmlFor="vp-h">Height</Label><Input id="vp-h" type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: +e.target.value }))} /></div>
            </div>
            <div className="md:col-span-2"><Label htmlFor="vp-motion">Motion Prompt</Label><textarea id="vp-motion" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.motionPrompt} onChange={e => setForm(f => ({ ...f, motionPrompt: e.target.value }))} /></div>
            <div><Label htmlFor="vp-ref">Reference Image URL</Label><Input id="vp-ref" value={form.referenceImageUrl} onChange={e => setForm(f => ({ ...f, referenceImageUrl: e.target.value }))} /></div>
            <div><Label htmlFor="vp-thumb">Thumbnail URL</Label><Input id="vp-thumb" value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} /></div>
          </div>
          {form.model === "kling" && <p className="text-xs text-muted-foreground">Kling supports additional params like camera motion — configure in motion prompt.</p>}
          {form.model === "seedance" && <p className="text-xs text-muted-foreground">Seedance defaults to high quality mode.</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm"><Check className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
            <Button variant="ghost" onClick={cancel} size="sm"><X className="h-4 w-4 mr-1" />Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {videoPresets.length === 0 && !creating && <div className="text-center py-12 text-muted-foreground">No video presets yet.</div>}
        {videoPresets.map(preset => (
          <Card key={preset.id} className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {preset.thumbnailUrl ? <img src={preset.thumbnailUrl} alt={preset.displayName} className="h-10 w-10 object-cover" /> : <Clapperboard className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{preset.displayName}</div>
              <div className="text-xs text-muted-foreground">{preset.model} · {preset.duration}s · {preset.width}×{preset.height} · {preset.fps}fps</div>
            </div>
            <Badge variant="secondary" className="text-xs">{preset.model}</Badge>
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
