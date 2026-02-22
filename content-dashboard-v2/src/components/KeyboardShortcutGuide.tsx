"use client"

import { useEffect, useState } from "react"
import { X, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string[]; description: string }[]
}

const groups: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["g", "d"], description: "Go to Dashboard" },
      { keys: ["g", "g"], description: "Go to Generate" },
      { keys: ["g", "a"], description: "Go to Approve" },
      { keys: ["g", "v"], description: "Go to Video" },
      { keys: ["g", "q"], description: "Go to Queue" },
      { keys: ["g", "s"], description: "Go to Settings" },
      { keys: ["Esc"], description: "Close modal / cancel" },
    ],
  },
  {
    title: "Generate",
    shortcuts: [
      { keys: ["⌘", "Enter"], description: "Start generation" },
      { keys: ["c"], description: "Focus character selector" },
      { keys: ["p"], description: "Focus preset selector" },
    ],
  },
  {
    title: "Approval",
    shortcuts: [
      { keys: ["a"], description: "Approve selected" },
      { keys: ["r"], description: "Reject selected" },
      { keys: ["←", "→"], description: "Navigate items" },
      { keys: ["Space"], description: "Toggle selection" },
      { keys: ["⌘", "a"], description: "Select all" },
    ],
  },
  {
    title: "Queue",
    shortcuts: [
      { keys: ["f"], description: "Toggle filters" },
      { keys: ["⌘", "r"], description: "Retry failed jobs" },
    ],
  },
  {
    title: "Video",
    shortcuts: [
      { keys: ["⌘", "Enter"], description: "Start video generation" },
      { keys: ["Space"], description: "Play/pause preview" },
    ],
  },
]

export function KeyboardShortcutGuide() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === "Escape" && open) setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Keyboard className="h-5 w-5" /> Keyboard Shortcuts</h2>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-6 space-y-6">
          {groups.map(group => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm">{s.description}</span>
                    <div className="flex gap-1">
                      {s.keys.map((k, j) => (
                        <kbd key={j} className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded bg-muted border border-border text-xs font-mono">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
