"use client"

import { useState, useEffect, useCallback } from "react"
import { useConfigStore } from "@/store/config"
import { characterApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, X, Check, Upload, Users } from "lucide-react"
import type { Character } from "@/types"

interface CharacterForm {
  name: string
  displayName: string
  avatarUrl: string
  loraPath: string
  triggerWord: string
  defaultPromptSuffix: string
}

const emptyForm: CharacterForm = { name: "", displayName: "", avatarUrl: "", loraPath: "", triggerWord: "", defaultPromptSuffix: "" }

export function CharacterManagement() {
  const { characters, imagePresets, fetchCharacters } = useConfigStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CharacterForm>(emptyForm)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchCharacters() }, [fetchCharacters])

  const presetCount = useCallback((charId: string) => imagePresets.filter(p => (p as unknown as { characterId?: string }).characterId === charId).length, [imagePresets])

  const validate = (): string | null => {
    if (!form.name.trim()) return "Name is required"
    if (form.name.trim().length > 50) return "Name must be under 50 characters"
    if (!form.displayName.trim()) return "Display name is required"
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    setError(null)
    try {
      const data = { name: form.name.trim(), displayName: form.displayName.trim(), avatarUrl: form.avatarUrl.trim() || undefined, loraPath: form.loraPath.trim() || undefined, triggerWord: form.triggerWord.trim() || undefined, defaultPromptSuffix: form.defaultPromptSuffix.trim() || undefined }
      if (editing) {
        await characterApi.update(editing, data)
      } else {
        await characterApi.create(data)
      }
      await fetchCharacters()
      setEditing(null)
      setCreating(false)
      setForm(emptyForm)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      await characterApi.delete(id)
      await fetchCharacters()
      setDeleting(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (char: Character) => {
    setEditing(char.id)
    setCreating(false)
    setForm({ name: char.name, displayName: char.displayName, avatarUrl: char.avatarUrl ?? "", loraPath: char.loraPath ?? "", triggerWord: char.triggerWord ?? "", defaultPromptSuffix: char.defaultPromptSuffix ?? "" })
    setError(null)
  }

  const cancel = () => { setEditing(null); setCreating(false); setForm(emptyForm); setError(null) }

  const isEditing = editing !== null || creating

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Characters</h3>
          <p className="text-sm text-muted-foreground">{characters.length} character{characters.length !== 1 ? "s" : ""}</p>
        </div>
        {!isEditing && (
          <Button size="sm" onClick={() => { setCreating(true); setForm(emptyForm); setError(null) }}>
            <Plus className="h-4 w-4 mr-1" /> Add Character
          </Button>
        )}
      </div>

      {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

      {(creating || editing) && (
        <Card className="p-6 space-y-4 border-primary/30">
          <h4 className="font-medium">{creating ? "New Character" : "Edit Character"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="char-name">Name *</Label><Input id="char-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. maya" maxLength={50} aria-required /></div>
            <div><Label htmlFor="char-display">Display Name *</Label><Input id="char-display" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. Maya" maxLength={100} aria-required /></div>
            <div><Label htmlFor="char-avatar">Avatar URL</Label><Input id="char-avatar" value={form.avatarUrl} onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://..." /></div>
            <div><Label htmlFor="char-lora">LoRA Path</Label><Input id="char-lora" value={form.loraPath} onChange={e => setForm(f => ({ ...f, loraPath: e.target.value }))} placeholder="/models/lora/..." /></div>
            <div><Label htmlFor="char-trigger">Trigger Word</Label><Input id="char-trigger" value={form.triggerWord} onChange={e => setForm(f => ({ ...f, triggerWord: e.target.value }))} placeholder="e.g. mya_v1" /></div>
            <div><Label htmlFor="char-suffix">Default Prompt Suffix</Label><Input id="char-suffix" value={form.defaultPromptSuffix} onChange={e => setForm(f => ({ ...f, defaultPromptSuffix: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm"><Check className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
            <Button variant="ghost" onClick={cancel} size="sm"><X className="h-4 w-4 mr-1" />Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {characters.length === 0 && !creating && (
          <div className="text-center py-12 text-muted-foreground">No characters yet. Add one to get started.</div>
        )}
        {characters.map(char => (
          <Card key={char.id} className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {char.avatarUrl ? <img src={char.avatarUrl} alt={char.displayName} className="h-10 w-10 rounded-full object-cover" /> : char.displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{char.displayName}</div>
              <div className="text-xs text-muted-foreground truncate">{char.name}{char.triggerWord ? ` · ${char.triggerWord}` : ""}</div>
            </div>
            <Badge variant="secondary" className="text-xs">{presetCount(char.id)} presets</Badge>
            {deleting === char.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Delete?</span>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(char.id)} disabled={saving}>Yes</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(null)}>No</Button>
              </div>
            ) : (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(char)} aria-label={`Edit ${char.displayName}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(char.id)} aria-label={`Delete ${char.displayName}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
