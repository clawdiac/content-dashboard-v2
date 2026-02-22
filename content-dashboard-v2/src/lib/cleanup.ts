// Phase 2.6: Generated file cleanup job
// Deletes files for rejected/deleted content items

import { prisma } from '@/lib/prisma'
import { unlink, readdir, stat } from 'fs/promises'
import path from 'path'

const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated')
const VIDEO_DIR = path.join(GENERATED_DIR, 'videos')
const MAX_AGE_DAYS = 30

export async function cleanupRejectedFiles(): Promise<{ deleted: number; errors: number }> {
  let deleted = 0
  let errors = 0

  try {
    // Find rejected items with file URLs
    const rejectedItems = await prisma.contentItem.findMany({
      where: { status: 'rejected' },
      select: { id: true, imageUrl: true, videoUrl: true },
    })

    for (const item of rejectedItems) {
      const urls = [item.imageUrl, item.videoUrl].filter(Boolean) as string[]
      for (const url of urls) {
        if (url.startsWith('/generated/')) {
          const filepath = path.join(process.cwd(), 'public', url)
          try {
            await unlink(filepath)
            deleted++
          } catch (err: any) {
            if (err.code !== 'ENOENT') errors++
          }
        }
      }
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning rejected files:', error)
  }

  return { deleted, errors }
}

export async function cleanupOldFiles(): Promise<{ deleted: number; errors: number }> {
  let deleted = 0
  let errors = 0
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000

  for (const dir of [GENERATED_DIR, VIDEO_DIR]) {
    try {
      const files = await readdir(dir)
      for (const file of files) {
        if (file === 'videos') continue // skip subdirectory
        const filepath = path.join(dir, file)
        try {
          const stats = await stat(filepath)
          if (Date.now() - stats.mtimeMs > maxAge) {
            await unlink(filepath)
            deleted++
          }
        } catch {
          errors++
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  return { deleted, errors }
}

// Run cleanup (can be called from API or timer)
export async function runCleanup() {
  console.log('[Cleanup] Starting file cleanup...')
  const rejected = await cleanupRejectedFiles()
  const old = await cleanupOldFiles()
  console.log(`[Cleanup] Done. Rejected: ${rejected.deleted} deleted, ${rejected.errors} errors. Old: ${old.deleted} deleted, ${old.errors} errors.`)
  return { rejected, old }
}
