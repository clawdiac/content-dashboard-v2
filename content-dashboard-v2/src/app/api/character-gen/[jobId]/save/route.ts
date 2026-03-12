import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getJob, updateCharacterStatus } from '@/lib/character-gen-store'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { error: authError, session } = await requireApiAuth()
  if (authError) return authError

  const { jobId } = await params
  const job = getJob(jobId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const body = await request.json()
  const { excludedIndices = [] }: { excludedIndices: number[] } = body
  const excludedSet = new Set(excludedIndices)

  let saved = 0

  for (let i = 0; i < job.characters.length; i++) {
    const char = job.characters[i]
    // Skip excluded, not completed, or already saved characters
    if (char.status !== 'completed' || excludedSet.has(i) || char.characterId) continue

    try {
      const character = await prisma.character.create({
        data: {
          name: char.name,
          description: `Auto-generated from batch job ${jobId}`,
          avatarUrl: char.imageUrl || '',
          userId: session!.user.id,
        },
      })

      await prisma.characterPreset.create({
        data: {
          name: job.presetName,
          imageUrl: char.imageUrl || '',
          characterId: character.id,
          generationParams: char.characterJson as object,
        },
      })

      updateCharacterStatus(jobId, i, {
        characterId: character.id,
      })

      saved++
    } catch (err) {
      console.error(`[save] Error saving character ${char.name}:`, err)
    }
  }

  const total = job.characters.filter(
    (c, i) => c.status === 'completed' && !excludedSet.has(i)
  ).length

  return NextResponse.json({ saved, total })
}
