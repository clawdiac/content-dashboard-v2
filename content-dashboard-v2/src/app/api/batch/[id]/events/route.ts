import { NextResponse } from 'next/server'
import { generationQueue } from '@/lib/queue'
import { requireApiAuth } from '@/lib/api-auth'

// GET /api/batch/[id]/events — SSE endpoint for real-time batch progress
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  const { id } = await params

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const listener = (event: string, data: any) => {
        const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        try {
          controller.enqueue(encoder.encode(msg))
        } catch {
          // Stream closed
          generationQueue.removeSSEListener(id, listener)
        }
      }

      // Send initial keepalive
      controller.enqueue(encoder.encode(': connected\n\n'))

      generationQueue.addSSEListener(id, listener)

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
          generationQueue.removeSSEListener(id, listener)
        }
      }, 30000)

      // Clean up when stream is cancelled
      _request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        generationQueue.removeSSEListener(id, listener)
        try { controller.close() } catch {}
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
