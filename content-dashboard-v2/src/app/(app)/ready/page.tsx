import { requireAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { ReadyGrid } from "@/components/ready/ReadyGrid"

export default async function ReadyPage() {
  await requireAdmin()

  const items = await prisma.contentItem.findMany({
    where: { status: "done" },
    include: { assignedTo: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  })

  const serializableItems = items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }))

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ready Content</h1>
        <p className="text-sm text-muted-foreground">
          Download completed edits and mark content as posted.
        </p>
      </div>
      <ReadyGrid items={serializableItems} />
    </div>
  )
}
