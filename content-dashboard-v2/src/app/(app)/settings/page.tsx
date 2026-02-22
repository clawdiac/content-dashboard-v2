"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CharacterManagement, PresetManagement, VideoPresetManagement, APIKeyConfiguration, GeneralSettings } from "@/components/settings"
import { Users, Image, Clapperboard, Key, Settings2 } from "lucide-react"

const tabs = [
  { id: "characters", label: "Characters", icon: Users, component: CharacterManagement },
  { id: "presets", label: "Presets", icon: Image, component: PresetManagement },
  { id: "video-presets", label: "Video Presets", icon: Clapperboard, component: VideoPresetManagement },
  { id: "api-keys", label: "API Keys", icon: Key, component: APIKeyConfiguration },
  { id: "general", label: "General", icon: Settings2, component: GeneralSettings },
] as const

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("characters")
  const active = tabs.find(t => t.id === activeTab) ?? tabs[0]
  const ActiveComponent = active.component

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage characters, presets, API keys, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab nav */}
        <nav className="flex lg:flex-col gap-1 lg:w-48 shrink-0 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
