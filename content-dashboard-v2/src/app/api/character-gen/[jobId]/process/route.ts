import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireApiAuth } from '@/lib/api-auth'
import { generateImage } from '@/lib/generation'
import { getJob, updateCharacterStatus, claimNextPending } from '@/lib/character-gen-store'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { jobId } = await params
  const job = getJob(jobId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const idx = claimNextPending(jobId)
  if (idx === -1) {
    // No more pending — return current job state
    return NextResponse.json(getJob(jobId))
  }

  // Re-fetch job after claiming to get the updated character
  const updatedJob = getJob(jobId)!
  const char = updatedJob.characters[idx]

  try {
    // Generate image — retry once on failure
    const gp = job.genParams || { aspect_ratio: '9:16', resolution: '1K', num_images: 1 }
    const genConfig = { model: 'nano_banana_2' as const, aspect_ratio: gp.aspect_ratio as any, resolution: gp.resolution as any, num_images: gp.num_images as any }

    // Do NOT pass reference image to generation — analysis only. Generation uses text prompt only.
    let result = await generateImage(char.prompt, genConfig)

    // Retry once on failure
    if (!result.success || !result.imageUrl) {
      console.warn(`[character-gen] First attempt failed for ${char.name}, retrying...`, result.error)
      await new Promise(r => setTimeout(r, 2000)) // brief pause before retry
      result = await generateImage(char.prompt, genConfig)
    }

    if (!result.success || !result.imageUrl) {
      updateCharacterStatus(jobId, idx, {
        status: 'failed',
        error: result.error || 'Generation failed after retry',
      })
      return NextResponse.json(getJob(jobId))
    }

    // Save image: if base64 data URL, write to disk
    let finalImageUrl = result.imageUrl
    if (result.imageUrl.startsWith('data:')) {
      const matches = result.imageUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        const ext = matches[1].includes('jpeg') ? 'jpg' : 'png'
        const filename = `${randomUUID()}.${ext}`
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'characters')
        await mkdir(uploadsDir, { recursive: true })
        await writeFile(path.join(uploadsDir, filename), Buffer.from(matches[2], 'base64'))
        finalImageUrl = `/uploads/characters/${filename}`
      }
    }

    updateCharacterStatus(jobId, idx, {
      status: 'completed',
      imageUrl: finalImageUrl,
    })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[character-gen] Error processing character ${char.name}:`, errMsg)
    updateCharacterStatus(jobId, idx, {
      status: 'failed',
      error: errMsg,
    })
  }

  return NextResponse.json(getJob(jobId))
}
