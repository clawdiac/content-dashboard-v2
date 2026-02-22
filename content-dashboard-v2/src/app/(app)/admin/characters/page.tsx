"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Character {
  id: string
  name: string
  description: string | null
  createdAt: string
  presets: CharacterPreset[]
}

interface CharacterPreset {
  id: string
  name: string
  imageUrl: string
  characterId: string
}

export default function AdminCharactersPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCharacter, setShowAddCharacter] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  
  // Add character form
  const [newCharName, setNewCharName] = useState("")
  const [newCharDesc, setNewCharDesc] = useState("")
  
  // Add preset form
  const [newPresetName, setNewPresetName] = useState("")
  const [presetFile, setPresetFile] = useState<File | null>(null)

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    setLoading(true)
    const res = await fetch("/api/characters")
    const data = await res.json()
    setCharacters(data)
    setLoading(false)
  }

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCharName, description: newCharDesc }),
    })
    setNewCharName("")
    setNewCharDesc("")
    setShowAddCharacter(false)
    fetchCharacters()
  }

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("Delete this character and all its presets?")) return
    await fetch(`/api/characters/${id}`, { method: "DELETE" })
    setSelectedCharacter(null)
    fetchCharacters()
  }

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCharacter || !presetFile) return

    // Upload image first
    const formData = new FormData()
    formData.append("file", presetFile)

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!uploadRes.ok) {
      alert("Failed to upload image")
      return
    }

    const uploadData = await uploadRes.json()

    // Create preset
    await fetch(`/api/characters/${selectedCharacter.id}/presets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPresetName,
        imageUrl: uploadData.imageUrl,
      }),
    })

    setNewPresetName("")
    setPresetFile(null)
    // Refresh selected character
    const res = await fetch(`/api/characters/${selectedCharacter.id}`)
    const updated = await res.json()
    setSelectedCharacter(updated)
    fetchCharacters()
  }

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm("Delete this preset?")) return
    await fetch(`/api/presets/${presetId}`, { method: "DELETE" })
    // Refresh selected character
    if (selectedCharacter) {
      const res = await fetch(`/api/characters/${selectedCharacter.id}`)
      const updated = await res.json()
      setSelectedCharacter(updated)
    }
    fetchCharacters()
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Character Management</h1>
        <Button onClick={() => setShowAddCharacter(true)}>
          Add Character
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : characters.length === 0 ? (
        <p className="text-muted-foreground">No characters yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <Card 
              key={char.id} 
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedCharacter(char)}
            >
              <CardHeader>
                <CardTitle>{char.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {char.description || "No description"}
                </p>
                <p className="text-sm mt-2">
                  {char.presets?.length || 0} presets
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Character Modal */}
      {showAddCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Character</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCharacter} className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="e.g., Sarah"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newCharDesc}
                    onChange={(e) => setNewCharDesc(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddCharacter(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedCharacter.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCharacter.description || "No description"}
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteCharacter(selectedCharacter.id)}
              >
                Delete Character
              </Button>
            </CardHeader>
            <CardContent>
              {/* Existing Presets */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Presets</h3>
                {selectedCharacter.presets?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No presets yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedCharacter.presets?.map((preset) => (
                      <div key={preset.id} className="relative border rounded-md overflow-hidden">
                        <img src={preset.imageUrl} alt={preset.name} className="w-full h-32 object-cover" />
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-sm font-medium">{preset.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePreset(preset.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Preset Form */}
              <form onSubmit={handleAddPreset} className="border-t pt-4">
                <h3 className="font-semibold mb-3">Add New Preset</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Preset Name</Label>
                    <Input
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="e.g., Streaming, In kitchen"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Reference Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPresetFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Preset</Button>
                    <Button type="button" variant="outline" onClick={() => setSelectedCharacter(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
