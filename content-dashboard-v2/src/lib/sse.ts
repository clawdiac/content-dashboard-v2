import type { SSEEventType } from '@/types'

type SSECallback = (data: unknown) => void

export class SSEClient {
  private eventSource: EventSource | null = null
  private listeners: Map<string, SSECallback[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private url: string

  constructor(url: string = '/api/batch/events') {
    this.url = url
  }

  connect() {
    if (this.eventSource) this.disconnect()

    this.eventSource = new EventSource(this.url, { withCredentials: true })

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0
    }

    this.eventSource.onerror = () => {
      this.eventSource?.close()
      this.eventSource = null
      this.attemptReconnect()
    }

    const eventTypes: SSEEventType[] = [
      'batch:created', 'job:started', 'job:progress', 'job:completed',
      'job:failed', 'batch:completed', 'video:started', 'video:completed', 'video:failed',
    ]

    eventTypes.forEach((type) => {
      this.eventSource!.addEventListener(type, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          this.emit(type, data)
        } catch { /* ignore parse errors */ }
      })
    })

    this.eventSource.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data)
        if (parsed.type) this.emit(parsed.type, parsed.data ?? parsed)
      } catch { /* ignore */ }
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.eventSource?.close()
    this.eventSource = null
    this.reconnectAttempts = 0
  }

  on(event: string, callback: SSECallback) {
    const callbacks = this.listeners.get(event) ?? []
    callbacks.push(callback)
    this.listeners.set(event, callbacks)
    return () => {
      const cbs = this.listeners.get(event)
      if (cbs) this.listeners.set(event, cbs.filter((cb) => cb !== callback))
    }
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((cb) => cb(data))
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, Math.min(this.reconnectAttempts - 1, 5))
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  get connected() {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}
