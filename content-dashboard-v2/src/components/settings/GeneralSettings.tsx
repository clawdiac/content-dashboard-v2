"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Settings2, Moon, Sun, Monitor } from "lucide-react"

interface GeneralForm {
  theme: "light" | "dark" | "auto"
  defaultVideoModel: "seedance" | "kling"
  imageBatchSize: number
  videoBatchSize: number
  autoApprove: boolean
  showShortcuts: boolean
}

const defaults: GeneralForm = { theme: "dark", defaultVideoModel: "seedance", imageBatchSize: 20, videoBatchSize: 10, autoApprove: false, showShortcuts: true }

export function GeneralSettings() {
  const [form, setForm] = useState<GeneralForm>(defaults)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem("scm-settings", JSON.stringify(form))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (form.theme === "dark") document.documentElement.classList.add("dark")
      else if (form.theme === "light") document.documentElement.classList.remove("dark")
    } finally { setSaving(false) }
  }

  const ThemeIcon = form.theme === "dark" ? Moon : form.theme === "light" ? Sun : Monitor

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2"><Settings2 className="h-5 w-5" /> General Settings</h3>
        <p className="text-sm text-muted-foreground">App-wide preferences</p>
      </div>

      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <Label className="font-medium">Theme</Label>
          <div className="flex gap-2">
            {(["light", "dark", "auto"] as const).map(t => (
              <Button key={t} size="sm" variant={form.theme === t ? "default" : "outline"} onClick={() => setForm(f => ({ ...f, theme: t }))} className="capitalize">
                {t === "dark" ? <Moon className="h-4 w-4 mr-1" /> : t === "light" ? <Sun className="h-4 w-4 mr-1" /> : <Monitor className="h-4 w-4 mr-1" />}
                {t}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <Label className="font-medium">Default Video Model</Label>
          <div className="flex gap-2">
            {(["seedance", "kling"] as const).map(m => (
              <Button key={m} size="sm" variant={form.defaultVideoModel === m ? "default" : "outline"} onClick={() => setForm(f => ({ ...f, defaultVideoModel: m }))} className="capitalize">{m}</Button>
            ))}
          </div>
        </Card>

        <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gen-img-batch">Image Batch Size</Label>
            <Input id="gen-img-batch" type="number" min={1} max={100} value={form.imageBatchSize} onChange={e => setForm(f => ({ ...f, imageBatchSize: +e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="gen-vid-batch">Video Batch Size</Label>
            <Input id="gen-vid-batch" type="number" min={1} max={50} value={form.videoBatchSize} onChange={e => setForm(f => ({ ...f, videoBatchSize: +e.target.value }))} />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto-Approve Generated Content</Label>
              <p className="text-xs text-muted-foreground">Skip approval step (not recommended)</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.autoApprove}
              aria-label="Auto-approve toggle"
              onClick={() => setForm(f => ({ ...f, autoApprove: !f.autoApprove }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.autoApprove ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${form.autoApprove ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Show Keyboard Shortcuts</Label>
              <p className="text-xs text-muted-foreground">Press ? to view shortcuts anytime</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.showShortcuts}
              aria-label="Show shortcuts toggle"
              onClick={() => setForm(f => ({ ...f, showShortcuts: !f.showShortcuts }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.showShortcuts ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${form.showShortcuts ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : saved ? "✓ Saved" : "Save Settings"}</Button>
        <Button variant="ghost" onClick={() => setForm(defaults)}>Reset to Defaults</Button>
      </div>
    </div>
  )
}
