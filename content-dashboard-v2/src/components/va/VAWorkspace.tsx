"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type VAItem = {
  id: string
  title: string
  prompt: string
  imageUrl?: string | null
  status: string
  createdAt: string
}

function VAItemCard({ item }: { item: VAItem }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const markDone = async () => {
    await fetch(`/api/content/${item.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    })
    router.refresh()
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    await fetch(`/api/content/${item.id}/upload`, {
      method: "POST",
      body: formData,
    })
    await markDone()
    setUploading(false)
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{item.title}</CardTitle>
            <div className="text-xs text-muted-foreground">Assigned to you</div>
          </div>
          <Badge variant="secondary">{item.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-sm text-muted-foreground line-clamp-3">
          {item.prompt}
        </div>
        {item.imageUrl ? (
          <a
            href={item.imageUrl}
            className="text-xs text-primary"
            target="_blank"
            rel="noreferrer"
          >
            Download original
          </a>
        ) : (
          <div className="text-xs text-muted-foreground">No original file</div>
        )}
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-2">
        <label className="w-full">
          <input
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                handleUpload(file)
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Edited"}
          </Button>
        </label>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={markDone}
          disabled={uploading}
        >
          Mark Done
        </Button>
      </CardFooter>
    </Card>
  )
}

export function VAWorkspace({ items }: { items: VAItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nothing assigned yet. Check back soon.
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <VAItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
