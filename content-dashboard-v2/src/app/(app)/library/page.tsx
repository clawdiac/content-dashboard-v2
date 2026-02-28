'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, RefreshCw, Search, Play, ImageIcon, X } from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  prompt: string
  status: string
  type: string
  imageUrl: string | null
  videoUrl: string | null
  editedUrl: string | null
  createdAt: string
  updatedAt: string
  character: { id: string; name: string } | null
  batch: { id: string; name: string | null } | null
  preset: { id: string; name: string } | null
  assignedTo: { name: string | null; email: string | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  generating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  generated: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  queued: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  in_editing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  done: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  posted: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export default function LibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [characterFilter, setCharacterFilter] = useState<string>('all')
  const [previewId, setPreviewId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (characterFilter !== 'all') params.set('characterId', characterFilter)
      const qs = params.toString()
      const res = await fetch(`/api/content${qs ? `?${qs}` : ''}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : data.items ?? [])
    } catch (err) {
      console.error('Failed to fetch library items:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, characterFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const characters = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach((i) => {
      if (i.character) map.set(i.character.id, i.character.name)
    })
    return Array.from(map.entries())
  }, [items])

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.prompt.toLowerCase().includes(q) ||
        i.character?.name.toLowerCase().includes(q)
    )
  }, [items, search])

  const previewItem = previewId ? items.find((i) => i.id === previewId) : null

  const getMediaUrl = (item: ContentItem) =>
    item.editedUrl || item.imageUrl || item.videoUrl || null

  const handleDownload = (item: ContentItem) => {
    const url = getMediaUrl(item)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.title || item.id}.${item.type === 'video' ? 'mp4' : 'png'}`
    a.click()
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Library</h1>
          <p className="text-sm text-muted-foreground">
            Browse all generated content ({filtered.length} items)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, prompt, character..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="generating">Generating</option>
          <option value="generated">Generated</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="in_editing">In Editing</option>
          <option value="done">Done</option>
          <option value="posted">Posted</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>

        <select
          value={characterFilter}
          onChange={(e) => setCharacterFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Characters</option>
          {characters.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && items.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Grid + Preview */}
      {(!loading || items.length > 0) && (
        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
          {/* Grid */}
          <div className={`${previewId ? 'flex-1' : 'w-full'} overflow-y-auto min-w-0`}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <ImageIcon className="h-12 w-12 opacity-40" />
                <p>No content found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
                {filtered.map((item) => {
                  const url = getMediaUrl(item)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreviewId(item.id === previewId ? null : item.id)}
                      className={`group relative rounded-lg border overflow-hidden text-left transition-all hover:ring-2 hover:ring-primary/50 ${
                        item.id === previewId ? 'ring-2 ring-primary' : 'border-border'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-muted relative">
                        {url ? (
                          item.type === 'video' ? (
                            <div className="relative w-full h-full">
                              <video
                                src={url}
                                className="object-cover w-full h-full"
                                muted
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="h-8 w-8 text-white/80 drop-shadow" />
                              </div>
                            </div>
                          ) : (
                            <Image
                              src={url}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            />
                          )
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <ImageIcon className="h-8 w-8 opacity-40" />
                          </div>
                        )}
                      </div>

                      {/* Info overlay */}
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[item.status] || ''}`}
                          >
                            {item.status}
                          </Badge>
                          {item.character && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {item.character.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Preview sidebar */}
          {previewItem && (
            <div className="hidden lg:flex w-[380px] xl:w-[440px] flex-shrink-0 flex-col border-l border-border pl-4 overflow-y-auto gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium truncate">{previewItem.title}</h3>
                <Button variant="ghost" size="icon" onClick={() => setPreviewId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Preview media */}
              <div className="rounded-lg overflow-hidden bg-muted aspect-square relative">
                {getMediaUrl(previewItem) ? (
                  previewItem.type === 'video' ? (
                    <video
                      src={getMediaUrl(previewItem)!}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image
                      src={getMediaUrl(previewItem)!}
                      alt={previewItem.title}
                      fill
                      className="object-contain"
                      sizes="440px"
                    />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No media
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={STATUS_COLORS[previewItem.status] || ''}>
                    {previewItem.status}
                  </Badge>
                  <Badge variant="outline">{previewItem.type}</Badge>
                </div>

                {previewItem.character && (
                  <div>
                    <span className="text-muted-foreground">Character:</span>{' '}
                    {previewItem.character.name}
                  </div>
                )}

                {previewItem.batch && (
                  <div>
                    <span className="text-muted-foreground">Batch:</span>{' '}
                    {previewItem.batch.name || previewItem.batch.id}
                  </div>
                )}

                {previewItem.preset && (
                  <div>
                    <span className="text-muted-foreground">Preset:</span>{' '}
                    {previewItem.preset.name}
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  {new Date(previewItem.createdAt).toLocaleString()}
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">Prompt:</p>
                  <p className="text-xs bg-muted rounded p-2 max-h-32 overflow-y-auto">
                    {previewItem.prompt}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDownload(previewItem)}
                  disabled={!getMediaUrl(previewItem)}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
