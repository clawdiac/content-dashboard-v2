"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Key, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface KeyField {
  id: string
  label: string
  envKey: string
  placeholder: string
}

const keyFields: KeyField[] = [
  { id: "gemini", label: "Gemini API Key", envKey: "GEMINI_API_KEY", placeholder: "AIza..." },
  { id: "fal", label: "FAL Key (Seedance)", envKey: "FAL_KEY", placeholder: "fal_..." },
  { id: "kling-access", label: "Kling Access Key", envKey: "KLING_ACCESS_KEY", placeholder: "ak_..." },
  { id: "kling-secret", label: "Kling Secret Key", envKey: "KLING_SECRET_KEY", placeholder: "sk_..." },
]

export function APIKeyConfiguration() {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<Record<string, "idle" | "testing" | "success" | "error">>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const mask = (val: string) => val ? val.slice(0, 4) + "•".repeat(Math.max(0, val.length - 8)) + val.slice(-4) : ""

  const toggleVisible = (id: string) => setVisible(v => ({ ...v, [id]: !v[id] }))

  const testConnection = async (field: KeyField) => {
    setTesting(t => ({ ...t, [field.id]: "testing" }))
    try {
      const res = await fetch("/api/settings/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: field.id, key: keys[field.id] }),
      })
      setTesting(t => ({ ...t, [field.id]: res.ok ? "success" : "error" }))
    } catch {
      setTesting(t => ({ ...t, [field.id]: "error" }))
    }
    setTimeout(() => setTesting(t => ({ ...t, [field.id]: "idle" })), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keys),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* handled by UI */ }
    finally { setSaving(false) }
  }

  const hasChanges = Object.values(keys).some(v => v.trim() !== "")

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2"><Key className="h-5 w-5" /> API Keys</h3>
        <p className="text-sm text-muted-foreground">Manage API credentials for generation services</p>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-400">
        <Shield className="h-4 w-4 shrink-0" />
        <span>Keys are stored securely and never logged to console or external services.</span>
      </div>

      <div className="space-y-4">
        {keyFields.map(field => (
          <Card key={field.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`key-${field.id}`} className="font-medium">{field.label}</Label>
              <div className="flex items-center gap-2">
                {testing[field.id] === "testing" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {testing[field.id] === "success" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                {testing[field.id] === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                <Badge variant="secondary" className="text-[10px] font-mono">{field.envKey}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={`key-${field.id}`}
                  type={visible[field.id] ? "text" : "password"}
                  value={keys[field.id] ?? ""}
                  onChange={e => setKeys(k => ({ ...k, [field.id]: e.target.value }))}
                  placeholder={field.placeholder}
                  autoComplete="off"
                  aria-label={field.label}
                />
              </div>
              <Button size="sm" variant="ghost" onClick={() => toggleVisible(field.id)} aria-label={visible[field.id] ? "Hide" : "Show"}>
                {visible[field.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={() => testConnection(field)} disabled={!keys[field.id]?.trim() || testing[field.id] === "testing"}>
                Test
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Keys"}
        </Button>
        <Button variant="ghost" onClick={() => setKeys({})} disabled={!hasChanges}>Discard</Button>
      </div>
    </div>
  )
}
