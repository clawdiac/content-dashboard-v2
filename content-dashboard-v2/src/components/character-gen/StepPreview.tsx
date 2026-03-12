'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'

interface Props {
  previewImageUrl: string | null
  previewCharacterName: string
  presetName: string
  loading: boolean
  error: string | null
  onConfirm: () => void
  onEdit: () => void
}

export function StepPreview({
  previewImageUrl,
  previewCharacterName,
  presetName,
  loading,
  error,
  onConfirm,
  onEdit,
}: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Analyzing image and generating preview...
        </p>
        <p className="text-xs text-muted-foreground/60 text-center">This may take 15–30 seconds</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-destructive text-center">{error}</p>
        <Button variant="outline" onClick={onEdit}>Go Back &amp; Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Preview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s a preview of your character. Happy with it?
        </p>
      </div>

      {previewImageUrl && (
        <div className="flex justify-center">
          <div className="relative w-48 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={previewImageUrl}
              alt={previewCharacterName}
              width={192}
              height={341}
              className="w-full h-auto object-cover"
              unoptimized
            />
          </div>
        </div>
      )}

      <div className="text-center space-y-1">
        <p className="font-semibold">{previewCharacterName}</p>
        <p className="text-sm text-muted-foreground">{presetName}</p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onEdit}>Edit</Button>
        <Button onClick={onConfirm}>Looks good — Generate All</Button>
      </div>
    </div>
  )
}
