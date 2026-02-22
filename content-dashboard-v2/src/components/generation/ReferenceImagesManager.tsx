"use client"

import { useRef, useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ReferenceImage {
  id: string
  url: string
  source: "preset" | "upload"
  label: string
  file?: File
}

interface SortableItemProps {
  image: ReferenceImage
  onDelete: (id: string) => void
}

function SortableItem({ image, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-border bg-card p-2 transition-colors hover:bg-accent/50 ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <img
        src={image.url}
        alt={image.label}
        className="h-16 w-16 shrink-0 rounded-md border border-border object-cover"
      />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{image.label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(image.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function getImageLabel(image: ReferenceImage, index: number, allImages: ReferenceImage[]): string {
  if (image.source === "preset") return image.label
  const uploadsBefore = allImages
    .slice(0, index)
    .filter((img) => img.source === "upload").length
  return `Upload #${uploadsBefore + 1}`
}

interface ReferenceImagesManagerProps {
  images: ReferenceImage[]
  onChange: (images: ReferenceImage[]) => void
  maxImages?: number
}

export default function ReferenceImagesManager({
  images,
  onChange,
  maxImages = 5,
}: ReferenceImagesManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id)
      const newIndex = images.findIndex((img) => img.id === over.id)
      onChange(arrayMove(images, oldIndex, newIndex))
    }
  }

  function handleDelete(id: string) {
    onChange(images.filter((img) => img.id !== id))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPG and PNG files are allowed.")
      e.target.value = ""
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB).")
      e.target.value = ""
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(err.error || err.message || "Upload failed")
      }

      const { url, id } = await res.json()

      const newImage: ReferenceImage = {
        id: id || crypto.randomUUID(),
        url, // Server URL, not blob
        source: "upload",
        label: "", // Computed dynamically via getImageLabel
      }
      onChange([...images, newImage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  // Compute display images with dynamic labels
  const displayImages = images.map((img, idx) => ({
    ...img,
    label: getImageLabel(img, idx, images),
  }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages} images
        </span>
      </div>

      {displayImages.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayImages.map((img) => img.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {displayImages.map((image) => (
                <SortableItem key={image.id} image={image} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {images.length < maxImages && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
