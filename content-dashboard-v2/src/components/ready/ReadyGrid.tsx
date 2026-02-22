"use client"

import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export type ReadyItem = {
  id: string
  title: string
  prompt: string
  editedUrl?: string | null
  status: string
  assignedTo?: { name: string | null; email: string | null } | null
}

function ReadyCard({ item }: { item: ReadyItem }) {
  const router = useRouter()

  const markPosted = async () => {
    await fetch(`/api/content/${item.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "posted" }),
    })
    router.refresh()
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{item.title}</CardTitle>
            <div className="text-xs text-muted-foreground">
              {item.assignedTo?.name ?? item.assignedTo?.email ?? "Unassigned"}
            </div>
          </div>
          <Badge variant="success">Ready</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="text-sm text-muted-foreground line-clamp-3">
          {item.prompt}
        </div>
        {item.editedUrl ? (
          <a
            href={item.editedUrl}
            className="text-xs text-primary"
            target="_blank"
            rel="noreferrer"
          >
            Download edited
          </a>
        ) : (
          <div className="text-xs text-muted-foreground">No edited file yet</div>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        <Button type="button" onClick={markPosted} className="w-full">
          Mark Posted
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ReadyGrid({ items }: { items: ReadyItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No ready content yet.
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <ReadyCard key={item.id} item={item} />
      ))}
    </div>
  )
}
