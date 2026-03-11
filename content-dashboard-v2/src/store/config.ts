import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { characterApi, presetApi } from '@/lib/api'
import type { Character, ImagePreset, VideoPreset } from '@/types'

export interface CharacterPresetWithCharacter {
  id: string
  name: string
  imageUrl: string
  characterId: string
  character: { id: string; name: string }
  generationParams: Record<string, unknown> | null
  createdAt: string
}

interface ConfigState {
  characters: Character[]
  imagePresets: ImagePreset[]
  videoPresets: VideoPreset[]
  characterPresets: CharacterPresetWithCharacter[]
  comfyuiEndpoint: string
  loading: boolean
  error: string | null

  fetchCharacters: () => Promise<void>
  fetchPresets: () => Promise<void>
  setComfyuiEndpoint: (endpoint: string) => void
  clearError: () => void
}

export const useConfigStore = create<ConfigState>()(
  devtools(
    persist(
      (set) => ({
        characters: [],
        imagePresets: [],
        videoPresets: [],
        characterPresets: [],
        comfyuiEndpoint: '',
        loading: false,
        error: null,

        fetchCharacters: async () => {
          set({ loading: true, error: null })
          try {
            const data = await characterApi.list()
            set({ characters: data.characters ?? (data as unknown as Character[]), loading: false })
          } catch (e) {
            set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch characters' })
          }
        },

        fetchPresets: async () => {
          set({ loading: true, error: null })
          try {
            const [imgData, vidData, charPresetData] = await Promise.all([
              presetApi.listImage(),
              presetApi.listVideo(),
              fetch('/api/presets').then((r) => r.json()),
            ])
            set({
              imagePresets: imgData.presets ?? (imgData as unknown as ImagePreset[]) ?? [],
              videoPresets: vidData.presets ?? (vidData as unknown as VideoPreset[]) ?? [],
              characterPresets: Array.isArray(charPresetData) ? charPresetData : [],
              loading: false,
            })
          } catch (e) {
            set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch presets' })
          }
        },

        setComfyuiEndpoint: (endpoint: string) => set({ comfyuiEndpoint: endpoint }),
        clearError: () => set({ error: null }),
      }),
      { name: 'config-store', partialize: (state) => ({ comfyuiEndpoint: state.comfyuiEndpoint }) }
    ),
    { name: 'config-store' }
  )
)
