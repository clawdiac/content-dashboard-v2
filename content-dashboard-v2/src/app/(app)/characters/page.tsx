'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { Plus, User, Loader2, X, Sparkles } from 'lucide-react'

interface Tag {
  id: string
  name: string
  _count?: { characters: number }
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
  createdAt: string
  presets: CharacterPreset[]
  tags: Tag[]
  _count?: { presets: number }
}

export default function CharactersPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTagInput, setNewTagInput] = useState('')
  const [newSelectedTags, setNewSelectedTags] = useState<Tag[]>([])

  const fetchCharacters = useCallback(async () => {
    const url = activeTag
      ? `/api/characters?tag=${encodeURIComponent(activeTag)}`
      : '/api/characters'
    const res = await fetch(url)
    if (res.ok) {
      setCharacters(await res.json())
    }
  }, [activeTag])

  const fetchTags = useCallback(async () => {
    const res = await fetch('/api/tags')
    if (res.ok) {
      setTags(await res.json())
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchCharacters(), fetchTags()]).finally(() => setLoading(false))
  }, [fetchCharacters, fetchTags])

  useEffect(() => {
    fetchCharacters()
  }, [activeTag, fetchCharacters])

  const availableTags = useMemo(
    () => tags.filter((tag) => !newSelectedTags.find((t) => t.id === tag.id)),
    [tags, newSelectedTags]
  )

  const getAvatarUrl = (char: Character) => {
    if (char.avatarUrl) return char.avatarUrl
    if (char.presets.length > 0) return char.presets[0].imageUrl
    return null
  }

  const handleCreateTag = async () => {
    if (!newTagInput.trim()) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagInput.trim() }),
    })
    if (res.ok) {
      const tag = await res.json()
      if (!newSelectedTags.find((t) => t.id === tag.id)) {
        setNewSelectedTags((prev) => [...prev, tag])
      }
      setNewTagInput('')
      fetchTags()
    }
  }

  const handleCreateCharacter = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          tagIds: newSelectedTags.map((t) => t.id),
        }),
      })
      if (res.ok) {
        setNewName('')
        setNewDescription('')
        setNewTagInput('')
        setNewSelectedTags([])
        setDialogOpen(false)
        fetchCharacters()
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Characters</h1>
          <p className="text-sm text-muted-foreground">
            Manage character presets, tags, and avatars.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/creator">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Characters
            </Link>
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Character
          </Button>
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeTag ? 'outline' : 'default'}
          size="sm"
          onClick={() => setActiveTag(null)}
        >
          All
        </Button>
        {tags.map((tag) => (
          <Button
            key={tag.id}
            variant={activeTag === tag.name ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTag(tag.name)}
          >
            {tag.name}
            {tag._count?.characters !== undefined && (
              <span className="ml-1 text-[11px] text-muted-foreground">
                {tag._count.characters}
              </span>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : characters.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 py-16 text-center text-sm text-muted-foreground">
          No characters yet. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => {
            const avatarUrl = getAvatarUrl(char)
            return (
              <Card
                key={char.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => router.push(`/characters/${char.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={char.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{char.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {char.description || 'No description'}
                      </div>
                    </div>
                  </div>
                  {char.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {char.tags.slice(0, 5).map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {char._count?.presets ?? char.presets.length} presets
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Character</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Sarah"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                {newSelectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {newSelectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() =>
                          setNewSelectedTags((prev) =>
                            prev.filter((t) => t.id !== tag.id)
                          )
                        }
                      >
                        {tag.name}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateTag()
                      }
                    }}
                  />
                  <Button variant="outline" onClick={handleCreateTag}>
                    Add
                  </Button>
                </div>
                {availableTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() =>
                          setNewSelectedTags((prev) => [...prev, tag])
                        }
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCharacter} disabled={creating || !newName.trim()}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
