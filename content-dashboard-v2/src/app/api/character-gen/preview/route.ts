import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireApiAuth } from '@/lib/api-auth'
import { analyzeCharacterImage } from '@/lib/character-analyzer'
import { applyRandomization } from '@/lib/character-randomizer'
import { buildCharacterPrompt } from '@/lib/character-prompt-builder'
import { pickUniqueNames, generatePrefixNames } from '@/lib/character-names'
import { generateImage } from '@/lib/generation'
import type { RandomizeConfig, CharacterJson } from '@/lib/character-randomizer'

export async function POST(request: Request) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const body = await request.json()
  const {
    referenceImageUrl,
    randomizeConfig,
    genParams,
    namingMode,
    namePrefix,
  }: {
    referenceImageUrl: string
    randomizeConfig: RandomizeConfig
    genParams?: { aspect_ratio: string; resolution: string; num_images: number }
    namingMode: 'random' | 'prefix'
    namePrefix?: string
  } = body

  if (!referenceImageUrl) {
    return NextResponse.json({ error: 'referenceImageUrl is required' }, { status: 400 })
  }

  try {
    // 1. Analyze reference image via Gemini
    const analyzedJson = await analyzeCharacterImage(referenceImageUrl) as CharacterJson

    // 2. Apply randomization
    const randomized = randomizeConfig
      ? applyRandomization(analyzedJson, randomizeConfig)
      : analyzedJson

    // 3. Pick one character name
    const characterName =
      namingMode === 'prefix' && namePrefix
        ? generatePrefixNames(namePrefix, 1)[0]
        : pickUniqueNames(1)[0]

    // 4. Build prompt
    const prompt = buildCharacterPrompt(randomized)

    // 5. Generate one preview image
    const gp = genParams || { aspect_ratio: '9:16', resolution: '1K', num_images: 1 }
    // Do NOT pass referenceImageUrl to generation — it would make Gemini reproduce the same person.
    // The reference image is only for Gemini analysis. Generation uses the text prompt only.
    const result = await generateImage(
      prompt,
      { model: 'nano_banana_2', aspect_ratio: gp.aspect_ratio, resolution: gp.resolution, num_images: 1 },
    )

    if (!result.success || !result.imageUrl) {
      return NextResponse.json({ error: result.error || 'Generation failed' }, { status: 500 })
    }

    // 6. Save base64 image to disk if needed
    let finalImageUrl = result.imageUrl
    if (result.imageUrl.startsWith('data:')) {
      const matches = result.imageUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        const ext = matches[1].includes('jpeg') ? 'jpg' : 'png'
        const filename = `preview-${randomUUID()}.${ext}`
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'characters')
        await mkdir(uploadsDir, { recursive: true })
        await writeFile(path.join(uploadsDir, filename), Buffer.from(matches[2], 'base64'))
        finalImageUrl = `/uploads/characters/${filename}`
      }
    }

    return NextResponse.json({
      imageUrl: finalImageUrl,
      characterName,
      characterJson: analyzedJson,
      randomizedJson: randomized,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Preview generation failed'
    console.error('[preview] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
