// Shared HTTP client with retry logic and timeout support

export interface FetchWithRetryOptions {
  maxRetries?: number
  timeoutMs?: number
  retryDelayMs?: number
  retryOn?: (response: Response) => boolean
}

const DEFAULT_OPTIONS: Required<FetchWithRetryOptions> = {
  maxRetries: 3,
  timeoutMs: 30000,
  retryDelayMs: 1000,
  retryOn: (res) => res.status >= 500 || res.status === 429,
}

/**
 * Fetch with automatic retry and timeout.
 * Retries on 5xx and 429 by default. Exponential backoff.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs)

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok || attempt === opts.maxRetries || !opts.retryOn(response)) {
        return response
      }

      console.warn(
        `[api-client] Retry ${attempt + 1}/${opts.maxRetries} for ${url} (status: ${response.status})`
      )
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === opts.maxRetries) {
        throw lastError
      }

      const isTimeout = lastError.name === 'AbortError'
      console.warn(
        `[api-client] Retry ${attempt + 1}/${opts.maxRetries} for ${url} (${isTimeout ? 'timeout' : lastError.message})`
      )
    }

    // Exponential backoff: 1s, 2s, 4s...
    const delay = opts.retryDelayMs * Math.pow(2, attempt)
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  throw lastError || new Error('fetchWithRetry exhausted retries')
}

/**
 * POST JSON with retry and timeout.
 */
export async function postJSON<T = unknown>(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    },
    options
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  return response.json() as Promise<T>
}

/**
 * GET with retry and timeout.
 */
export async function getJSON<T = unknown>(
  url: string,
  headers: Record<string, string> = {},
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(
    url,
    {
      method: 'GET',
      headers,
    },
    options
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  return response.json() as Promise<T>
}
