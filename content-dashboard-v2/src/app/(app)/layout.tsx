import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { AppShell } from "@/components/app/AppShell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <AppShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email,
        role: session.user.role,
      }}
    >
      {children}
    </AppShell>
  )
}
