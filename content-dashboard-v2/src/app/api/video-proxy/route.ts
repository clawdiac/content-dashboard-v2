import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import crypto from 'crypto'
import fs from 'fs'
import { mkdir } from 'fs/promises'
import path from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

const VIDEO_DIR = path.join(process.cwd(), 'public', 'generated', 'videos')

export async function GET(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const videoUrl = searchParams.get('url')

  if (!videoUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const hash = crypto.createHash('md5').update(videoUrl).digest('hex')
  const cachedFilename = `proxy_${hash}.mp4`
  const cachedPath = path.join(VIDEO_DIR, cachedFilename)
  const rangeHeader = request.headers.get('range')

  // Serve from local cache if available
  if (fs.existsSync(cachedPath)) {
    const stat = fs.statSync(cachedPath)
    const fileSize = stat.size

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
      if (match) {
        const start = parseInt(match[1], 10)
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
        const chunkSize = end - start + 1
        const readStream = fs.createReadStream(cachedPath, { start, end })
        return new Response(Readable.toWeb(readStream) as ReadableStream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': 'video/mp4',
          },
        })
      }
    }

    const readStream = fs.createReadStream(cachedPath)
    return new Response(Readable.toWeb(readStream) as ReadableStream, {
      status: 200,
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      },
    })
  }

  // Stream from remote while caching locally (tee pattern)
  try {
    const response = await fetch(videoUrl)
    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote fetch failed: ${response.status}` },
        { status: 502 }
      )
    }

    if (!response.body) {
      return NextResponse.json({ error: 'No response body from remote' }, { status: 502 })
    }

    await mkdir(VIDEO_DIR, { recursive: true })

    const [streamForResponse, streamForFile] = response.body.tee()

    // Cache to disk in background — don't block the response
    const writeStream = fs.createWriteStream(cachedPath)
    pipeline(Readable.fromWeb(streamForFile as Parameters<typeof Readable.fromWeb>[0]), writeStream)
      .catch((err) => {
        console.error('[video-proxy] Cache write failed:', err)
        fs.unlink(cachedPath, () => {})
      })

    const headers: Record<string, string> = {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    }
    const contentLength = response.headers.get('content-length')
    if (contentLength) headers['Content-Length'] = contentLength

    return new Response(streamForResponse, { status: 200, headers })
  } catch (error) {
    console.error('[video-proxy] Error fetching remote video:', error)
    return NextResponse.json({ error: 'Failed to fetch video from remote' }, { status: 502 })
  }
}
