import { requireVA } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { VAWorkspace } from "@/components/va/VAWorkspace"

export default async function VAPage() {
  const session = await requireVA()

  const items = await prisma.contentItem.findMany({
    where: {
      assignedToId: session.user.id,
      status: { in: ["approved", "in_editing"] },
    },
    orderBy: { createdAt: "desc" },
  })

  const serializableItems = items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }))

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">VA Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Download originals, upload edits, and mark tasks as done.
        </p>
      </div>
      <VAWorkspace items={serializableItems} />
    </div>
  )
}
