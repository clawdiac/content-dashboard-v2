'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Upload, ImageIcon, Loader2 } from 'lucide-react'

export interface GenParams {
  aspect_ratio: string
  resolution: string
  num_images: number
}

interface Props {
  uploadedImageUrl: string | null
  genParams: GenParams
  onImageUploaded: (url: string) => void
  onGenParamsChange: (params: GenParams) => void
  onNext: () => void
}

const ASPECT_RATIOS = ['1:1', '4:5', '9:16', '16:9', '4:3', '3:4'] as const
const RESOLUTIONS = [
  { value: '1K', label: '1K', hint: '' },
  { value: '2K', label: '2K', hint: '$0.13/img' },
  { value: '4K', label: '4K', hint: '$0.24/img' },
] as const
const IMAGES_PER_CHAR = [1, 2, 3, 4] as const

export function StepSource({ uploadedImageUrl, genParams, onImageUploaded, onGenParamsChange, onNext }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onImageUploaded(data.imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const update = (partial: Partial<GenParams>) => {
    onGenParamsChange({ ...genParams, ...partial })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Source Image</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a reference photo to analyze and generate character variations from.
        </p>
      </div>

      {/* Mode toggle — only Reference Picture is enabled */}
      <div className="flex gap-2">
        <Button variant="outline" disabled className="flex-1 opacity-40 cursor-not-allowed">
          <ImageIcon className="mr-2 h-4 w-4" />
          Generate from Prompt
          <span className="ml-2 text-[10px] text-muted-foreground">(coming soon)</span>
        </Button>
        <Button variant="default" className="flex-1">
          <Upload className="mr-2 h-4 w-4" />
          Reference Picture
        </Button>
      </div>

      {/* Upload area */}
      <Card
        className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
          {uploadedImageUrl ? (
            <div className="relative w-32 h-48 rounded-lg overflow-hidden">
              <Image
                src={uploadedImageUrl}
                alt="Reference"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <>
              {uploading ? (
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload reference image'}
                </p>
                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP supported</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadedImageUrl && (
        <p className="text-xs text-muted-foreground text-center">
          Image uploaded. Click the area above to change it.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Generation Params */}
      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-sm font-medium">Generation Settings</p>

        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
          <div className="flex flex-wrap gap-1">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                onClick={() => update({ aspect_ratio: ar })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  genParams.aspect_ratio === ar
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Resolution</Label>
          <div className="flex gap-1">
            {RESOLUTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => update({ resolution: r.value })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  genParams.resolution === r.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
                {r.hint && (
                  <span className={`text-[10px] ${
                    genParams.resolution === r.value ? 'text-primary-foreground/70' : 'text-muted-foreground/60'
                  }`}>
                    {r.hint}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Images per character */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Images per character</Label>
          <div className="flex gap-1">
            {IMAGES_PER_CHAR.map((n) => (
              <button
                key={n}
                onClick={() => update({ num_images: n })}
                className={`w-10 h-8 rounded-md text-xs font-medium transition-colors ${
                  genParams.num_images === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!uploadedImageUrl || uploading}>
          Next
        </Button>
      </div>
    </div>
  )
}
