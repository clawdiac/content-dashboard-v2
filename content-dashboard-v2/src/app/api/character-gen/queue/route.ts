import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { pickUniqueNames, generatePrefixNames } from '@/lib/character-names'
import { generateVariations } from '@/lib/character-randomizer'
import { buildCharacterPrompt } from '@/lib/character-prompt-builder'
import { createJob } from '@/lib/character-gen-store'
import type { CharacterJson, RandomizeConfig } from '@/lib/character-randomizer'

export async function POST(request: Request) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const body = await request.json()
  const {
    referenceImageUrl,
    characterJson,
    randomize,
    amount,
    namingMode,
    namePrefix,
    presetName,
    genParams,
  }: {
    referenceImageUrl: string
    characterJson: CharacterJson
    randomize: RandomizeConfig
    amount: number
    namingMode: 'random' | 'prefix'
    namePrefix?: string
    presetName: string
    genParams?: { aspect_ratio: string; resolution: string; num_images: number }
  } = body

  if (!characterJson || !amount || !presetName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const count = Math.min(Math.max(Number(amount) || 10, 1), 100)

  // Get existing character names to avoid duplicates
  const existingChars = await prisma.character.findMany({
    select: { name: true },
  })
  const existingNames = new Set(existingChars.map((c) => c.name))

  // Generate names
  let names: string[]
  if (namingMode === 'prefix' && namePrefix) {
    names = generatePrefixNames(namePrefix.trim(), count)
  } else {
    names = pickUniqueNames(count, existingNames)
  }

  // Deduplicate against DB — append suffix if collision
  const finalNames = names.map((name) => {
    if (!existingNames.has(name)) return name
    let suffix = 2
    while (existingNames.has(`${name} ${suffix}`)) suffix++
    return `${name} ${suffix}`
  })

  // Generate character variations
  const variations = generateVariations(characterJson, randomize, count)

  // Build prompts for each variation
  const characters = finalNames.map((name, i) => ({
    name,
    characterJson: variations[i],
    prompt: buildCharacterPrompt(variations[i]),
    status: 'pending' as const,
  }))

  console.log(`[character-gen] Job created with ${characters.length} characters. Prompts:`)
  characters.forEach((c, i) => {
    console.log(`[character-gen] Character ${i + 1} (${c.name}):`, c.prompt.slice(0, 200) + '...')
  })

  // Create job in memory store
  const job = createJob({
    referenceImageUrl: referenceImageUrl || '',
    characterJson,
    randomizeConfig: randomize,
    presetName,
    characters,
    genParams: genParams || { aspect_ratio: '9:16', resolution: '1K', num_images: 1 },
  })

  return NextResponse.json({
    jobId: job.id,
    totalCount: characters.length,
    characters: characters.map(({ name, characterJson }) => ({ name, characterJson })),
  })
}
