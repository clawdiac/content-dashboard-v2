"use client"

import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { SSEProvider, useSSE } from "@/context/SSEContext"
import { KeyboardShortcutGuide } from "@/components/KeyboardShortcutGuide"
import {
  LayoutDashboard,
  Sparkles,
  CheckSquare,
  ListOrdered,
  Settings,
  LogOut,
  Clapperboard,
  Layers,
  Briefcase,
  Wifi,
  WifiOff,
  GalleryHorizontalEnd,
} from "lucide-react"

const adminNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/approve", label: "Approve", icon: CheckSquare },
  { href: "/video", label: "Video", icon: Clapperboard },
  { href: "/batch", label: "Batch", icon: Layers },
  { href: "/queue", label: "Queue", icon: ListOrdered },
  { href: "/library", label: "Library", icon: GalleryHorizontalEnd },
  { href: "/settings", label: "Settings", icon: Settings },
]

const vaNav = [{ href: "/va", label: "VA Workspace", icon: Briefcase }]

type AppShellProps = {
  user: {
    name: string | null
    email: string
    role: string
  }
  children: React.ReactNode
}

function ConnectionIndicator() {
  const { connected } = useSSE()
  return (
    <div className={cn("flex items-center gap-2 text-xs", connected ? "text-emerald-400" : "text-yellow-500")}>
      {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {connected ? "Live" : "Reconnecting..."}
    </div>
  )
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = user.role === "admin"
  const navItems = isAdmin ? adminNav : vaNav

  return (
    <SSEProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
            <div className="flex items-center gap-2 px-3">
              <Clapperboard className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-tight">SCM</span>
            </div>

            <Separator className="my-4" />

            <nav className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href || 
                  (item.href !== "/" && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            <div className="mt-auto space-y-4 pt-6">
              <ConnectionIndicator />
              <Separator />
              <div className="flex items-center gap-3 px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(user.name ?? user.email)?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 truncate">
                  <div className="text-sm font-medium truncate">{user.name ?? user.email}</div>
                  <Badge variant="subtle" className="text-[10px]">
                    {isAdmin ? "Admin" : "VA"}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex flex-1 flex-col">
            {/* Mobile header */}
            <header className="border-b border-border bg-card px-6 py-4 lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clapperboard className="h-5 w-5 text-primary" />
                  <span className="font-bold">SCM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="subtle">{isAdmin ? "Admin" : "VA"}</Badge>
                  <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                    Sign Out
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {navItems.map((item) => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => router.push(item.href)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </header>

            <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">{children}</main>
            <KeyboardShortcutGuide />
          </div>
        </div>
      </div>
    </SSEProvider>
  )
}
