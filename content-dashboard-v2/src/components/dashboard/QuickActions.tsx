'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Film, CheckSquare, ListOrdered } from 'lucide-react'

const actions = [
  { label: 'Generate Images', icon: Sparkles, href: '/generate', shortcut: 'G' },
  { label: 'Generate Videos', icon: Film, href: '/video', shortcut: 'V' },
  { label: 'Review Approvals', icon: CheckSquare, href: '/approval', shortcut: 'A' },
  { label: 'View Queue', icon: ListOrdered, href: '/queue', shortcut: 'Q' },
]

export function QuickActions() {
  const router = useRouter()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.target instanceof HTMLElement && e.target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      const action = actions.find((a) => a.shortcut.toLowerCase() === key)
      if (action) {
        e.preventDefault()
        router.push(action.href)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
                onClick={() => router.push(action.href)}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{action.label}</span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {action.shortcut}
                </kbd>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
