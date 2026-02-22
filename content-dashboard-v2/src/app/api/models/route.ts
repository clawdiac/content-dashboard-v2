import { NextRequest, NextResponse } from 'next/server'
import { MODEL_REGISTRY, type ModelRegistryEntry, type ModelType } from '@/lib/models'
import { requireApiAuth } from '@/lib/api-auth'

function isAvailable(entry: ModelRegistryEntry): boolean {
  return entry.envKeys.every((key) => !!process.env[key])
}

export async function GET(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const url = new URL(request.url)
  const type = url.searchParams.get('type') as ModelType | null

  const models = Object.values(MODEL_REGISTRY)
    .filter((model) => (type ? model.type === type : true))
    .map((model) => ({
      ...model,
      available: isAvailable(model),
    }))

  return NextResponse.json({ models })
}
