'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Check,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'

interface Tag {
  id: string
  name: string
}

interface CharacterPreset {
  id: string
  name: string
  imageUrl: string
}

interface Character {
  id: string
  name: string
  description: string | null
  avatarUrl: string | null
  presets: CharacterPreset[]
  tags: Tag[]
}

export default function CharacterDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const characterId = params.id

  const [character, setCharacter] = useState<Character | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState<Tag[]>([])
  const [editTagInput, setEditTagInput] = useState('')

  const [presetDialogOpen, setPresetDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetFile, setPresetFile] = useState<File | null>(null)
  const [presetPreview, setPresetPreview] = useState<string | null>(null)
  const [addingPreset, setAddingPreset] = useState(false)

  const fetchCharacter = useCallback(async () => {
    const res = await fetch(`/api/characters/${characterId}`)
    if (res.ok) {
      const data = await res.json()
      setCharacter(data)
      setEditName(data.name)
      setEditDescription(data.description || '')
      setEditTags(data.tags || [])
    }
  }, [characterId])

  const fetchTags = useCallback(async () => {
    const res = await fetch('/api/tags')
    if (res.ok) {
      setAllTags(await res.json())
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchCharacter(), fetchTags()]).finally(() => setLoading(false))
  }, [fetchCharacter, fetchTags])

  const availableTags = useMemo(
    () => allTags.filter((t) => !editTags.find((et) => et.id === t.id)),
    [allTags, editTags]
  )

  const handleSave = async () => {
    if (!character) return
    if (!editName.trim()) return

    setSaving(true)
    try {
      const res = await fetch(`/api/characters/${characterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          avatarUrl: character.avatarUrl,
          tagIds: editTags.map((t) => t.id),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCharacter(updated)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (character) {
      setEditName(character.name)
      setEditDescription(character.description || '')
      setEditTags(character.tags || [])
    }
    setEditing(false)
  }

  const handleAddEditTag = async () => {
    if (!editTagInput.trim()) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editTagInput.trim() }),
    })
    if (res.ok) {
      const tag = await res.json()
      if (!editTags.find((t) => t.id === tag.id)) {
        setEditTags([...editTags, tag])
      }
      setEditTagInput('')
      fetchTags()
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) return
      const { url } = await uploadRes.json()

      const res = await fetch(`/api/characters/${characterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: character!.name,
          description: character!.description,
          avatarUrl: url,
          tagIds: character!.tags.map((t) => t.id),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCharacter(updated)
      }
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteCharacter = async () => {
    if (!character) return
    const confirmed = window.confirm(
      `Delete ${character.name} and all its presets? This cannot be undone.`
    )
    if (!confirmed) return
    await fetch(`/api/characters/${characterId}`, { method: 'DELETE' })
    router.push('/characters')
  }

  const handleDeletePreset = async (presetId: string) => {
    const confirmed = window.confirm('Delete this preset? This cannot be undone.')
    if (!confirmed) return
    const res = await fetch(
      `/api/characters/${characterId}/presets/${presetId}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      fetchCharacter()
    }
  }

  const handleAddPreset = async () => {
    if (!presetName.trim() || !presetFile) return
    setAddingPreset(true)
    try {
      const formData = new FormData()
      formData.append('file', presetFile)
      const uploadRes = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) return
      const { url } = await uploadRes.json()

      const res = await fetch(`/api/characters/${characterId}/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: presetName.trim(),
          imageUrl: url,
        }),
      })
      if (res.ok) {
        setPresetDialogOpen(false)
        setPresetName('')
        setPresetFile(null)
        setPresetPreview(null)
        fetchCharacter()
      }
    } finally {
      setAddingPreset(false)
    }
  }

  const handlePresetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPresetFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPresetPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  if (loading || !character) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const avatarUrl =
    character.avatarUrl ||
    (character.presets.length > 0 ? character.presets[0].imageUrl : null)

  return (
    <div className="space-y-8 max-w-5xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/characters')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Characters
      </Button>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative group">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={character.name}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            {uploadingAvatar ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Upload className="h-5 w-5 text-white" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleAvatarUpload(f)
              }}
              disabled={uploadingAvatar}
            />
          </label>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-bold"
                placeholder="Character name"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {editTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        setEditTags(editTags.filter((t) => t.id !== tag.id))
                      }
                    >
                      {tag.name}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddEditTag()
                      }
                    }}
                    className="max-w-xs"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddEditTag}>
                    Add
                  </Button>
                </div>
                {availableTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer text-xs hover:bg-muted"
                        onClick={() => setEditTags([...editTags, tag])}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3 w-3" />
                  )}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {character.name}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              {character.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {character.description}
                </p>
              )}
              {character.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {character.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDeleteCharacter}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Presets ({character.presets.length})
          </h2>
          <Button size="sm" onClick={() => setPresetDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Preset
          </Button>
        </div>

        {character.presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 py-12 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No presets yet. Add one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {character.presets.map((preset) => (
              <Card key={preset.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={preset.imageUrl}
                    alt={preset.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {preset.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeletePreset(preset.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {presetDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add Preset</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPresetDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                {presetPreview ? (
                  <div className="relative">
                    <Image
                      src={presetPreview}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                      unoptimized
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-black/50"
                      onClick={() => {
                        setPresetFile(null)
                        setPresetPreview(null)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload image
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handlePresetFileChange}
                    />
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setPresetDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddPreset}
                  disabled={!presetName.trim() || !presetFile || addingPreset}
                >
                  {addingPreset && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Preset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
