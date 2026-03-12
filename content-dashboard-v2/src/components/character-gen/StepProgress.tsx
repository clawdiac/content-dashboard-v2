'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, XCircle, X, Trash2, RotateCcw } from 'lucide-react'
import type { CharGenJob } from '@/lib/character-gen-store'

interface Props {
  jobId: string
  onSaved: () => void
}

const CONCURRENCY = 3

export function StepProgress({ jobId, onSaved }: Props) {
  const [job, setJob] = useState<CharGenJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set())
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const activeProcesses = useRef(0)

  const fetchJob = useCallback(async (): Promise<CharGenJob | null> => {
    try {
      const res = await fetch(`/api/character-gen/${jobId}`, { credentials: 'include' })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`[character-gen] fetchJob ${res.status}: ${body}`)
        return null
      }
      const data: CharGenJob = await res.json()
      setJob(data)
      return data
    } catch (err) {
      console.error('[character-gen] fetchJob error:', err)
      return null
    }
  }, [jobId])

  const processNext = useCallback(async () => {
    if (activeProcesses.current >= CONCURRENCY) return
    activeProcesses.current++
    try {
      const res = await fetch(`/api/character-gen/${jobId}/process`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const data: CharGenJob = await res.json()
        setJob(data)
      } else {
        const body = await res.text().catch(() => '')
        console.error(`[character-gen] processNext ${res.status}: ${body}`)
      }
    } finally {
      activeProcesses.current--
    }
  }, [jobId])

  useEffect(() => {
    if (!jobId) return
    let stopped = false

    const run = async () => {
      const initialJob = await fetchJob()
      if (!initialJob) {
        setError('Job not found')
        return
      }

      while (!stopped) {
        const currentJob = await fetchJob()
        if (!currentJob) break
        if (currentJob.status === 'completed' || currentJob.status === 'failed') break

        const pendingCount = currentJob.characters.filter((c) => c.status === 'pending').length
        const generatingCount = currentJob.characters.filter((c) => c.status === 'generating').length

        const canLaunch = Math.min(pendingCount, CONCURRENCY - generatingCount - activeProcesses.current)
        for (let i = 0; i < canLaunch; i++) {
          processNext()
        }

        if (pendingCount === 0 && generatingCount === 0) break

        await new Promise((r) => setTimeout(r, 3000))
      }

      if (!stopped) await fetchJob()
    }

    run()

    return () => {
      stopped = true
    }
  }, [jobId, fetchJob, processNext])

  const toggleExclude = (idx: number) => {
    setExcludedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/character-gen/${jobId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ excludedIndices: [...excludedIndices] }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      onSaved()
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const total = job.characters.length
  const completed = job.completedCount
  const failed = job.failedCount
  const done = completed + failed
  const isDone = job.status === 'completed' || job.status === 'failed'
  const canSave = !saving && !saved && job.characters.some(
    (c, i) => c.status === 'completed' && !excludedIndices.has(i)
  )

  const selectedChar = selectedIndex !== null ? job.characters[selectedIndex] : null
  const isSelectedExcluded = selectedIndex !== null ? excludedIndices.has(selectedIndex) : false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {isDone ? 'Generation Complete' : 'Generating Characters'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isDone
              ? `Done! ${completed} generated, ${failed} failed.`
              : `Generating... ${done} / ${total}`}
          </p>
        </div>
        <div>
          {saved ? (
            <Button asChild>
              <Link href="/characters">View Characters</Link>
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!canSave}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save to Characters
            </Button>
          )}
        </div>
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-5 gap-2">
        {job.characters.map((char, i) => {
          const isExcl = excludedIndices.has(i)
          return (
            <div
              key={i}
              className={`cursor-pointer transition-opacity ${isExcl ? 'opacity-30' : ''}`}
              onClick={() => setSelectedIndex(i)}
            >
              <div
                className={`aspect-[9/16] rounded-lg overflow-hidden bg-muted relative ${
                  char.status === 'failed' ? 'ring-2 ring-destructive' : ''
                }`}
              >
                {char.status === 'completed' && char.imageUrl ? (
                  <Image
                    src={char.imageUrl}
                    alt={char.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : char.status === 'failed' ? (
                  <div className="flex items-center justify-center h-full">
                    <XCircle className="h-8 w-8 text-destructive opacity-50" />
                  </div>
                ) : (
                  <div className="animate-pulse bg-muted-foreground/10 h-full w-full" />
                )}
              </div>
              <p
                className={`text-[10px] text-center mt-1 truncate px-1 ${
                  isExcl ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}
              >
                {char.name}
              </p>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && selectedChar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative bg-background rounded-xl p-4 max-w-xs w-full mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted relative">
              {selectedChar.status === 'completed' && selectedChar.imageUrl ? (
                <Image
                  src={selectedChar.imageUrl}
                  alt={selectedChar.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : selectedChar.status === 'failed' ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <XCircle className="h-12 w-12 text-destructive opacity-50" />
                  <p className="text-xs text-destructive mt-2">
                    {selectedChar.error || 'Generation failed'}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="text-center">
              <p className={`font-semibold ${isSelectedExcluded ? 'line-through text-muted-foreground' : ''}`}>
                {selectedChar.name}
              </p>
              <p className="text-xs text-muted-foreground">{job.presetName}</p>
            </div>

            {isSelectedExcluded ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { toggleExclude(selectedIndex); setSelectedIndex(null) }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => { toggleExclude(selectedIndex); setSelectedIndex(null) }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
