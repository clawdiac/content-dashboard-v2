// Image generation service using Google Gemini API
// Uses mapper for request building. Supports multiple reference images.
// With retry logic (max 3 retries on timeout) and 30s timeout per request

import { fetchWithRetry } from '@/lib/api-client'
import { mapNanoBananaProRequest } from '@/lib/models/mapper'
import type { NanoBananaProConfig } from '@/lib/models'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface GenerationResult {
  success: boolean
  imageUrl?: string
  error?: string
}

/**
 * Fetch a reference image URL and return base64 data.
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    // Convert relative paths to absolute URLs for server-side fetch
    let fetchUrl = url
    if (url.startsWith('/')) {
      // HARDCODED FIX: Use localhost:3000 directly for reference image fetching
      const baseUrl = 'http://localhost:3000'
      fetchUrl = `${baseUrl}${url}`
      console.log('[Generation] Using localhost:3000 to fetch reference image')
    }
    console.log('[Generation] Fetching reference image from:', fetchUrl)
    const response = await fetch(fetchUrl)
    if (!response.ok) {
      console.error('[Generation] Failed to fetch reference image:', response.status, response.statusText)
      return null
    }
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/png'
    console.log('[Generation] Reference image loaded, size:', buffer.byteLength, 'bytes, mime:', mimeType)
    return { data: base64, mimeType }
  } catch (err) {
    console.error('[Generation] Failed to fetch reference image:', err)
    return null
  }
}

// Gemini image generation via mapper
export async function generateWithGemini(
  prompt: string,
  config: NanoBananaProConfig,
  referenceImageUrls?: (string | null)[] | string | null
): Promise<GenerationResult> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'GEMINI_API_KEY not configured' }
  }

  try {
    // Normalize reference images to array of URLs
    const urls: string[] = []
    if (referenceImageUrls) {
      if (Array.isArray(referenceImageUrls)) {
        for (const u of referenceImageUrls) {
          if (u) urls.push(u)
        }
      } else {
        urls.push(referenceImageUrls)
      }
    }

    // Fetch all reference images as base64
    let refImagesBase64: { data: string; mimeType: string }[] = []
    if (urls.length > 0) {
      console.log(`[Generation] Fetching ${urls.length} reference image(s)`)
      const results = await Promise.all(urls.map(fetchImageAsBase64))
      refImagesBase64 = results.filter((r): r is { data: string; mimeType: string } => r !== null)
    }

    // Use mapper to build request
    const requestBody = mapNanoBananaProRequest(
      prompt,
      config,
      refImagesBase64.length > 0 ? refImagesBase64 : null
    )

    const model = 'gemini-3-pro-image-preview'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
      {
        maxRetries: 3,
        timeoutMs: 30000,
        retryOn: (res) => res.status >= 500 || res.status === 429 || res.status === 503,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Generation] Gemini API error ${response.status}:`, errorText.slice(0, 500))
      return { success: false, error: `API error: ${response.status} - ${errorText}` }
    }

    const data = await response.json()
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)

    if (!imagePart?.inlineData?.data) {
      // Log what we actually got back
      const textParts = data.candidates?.[0]?.content?.parts?.filter((p: any) => p.text)
      const textContent = textParts?.map((p: any) => p.text).join(' ') || 'none'
      console.error('[Generation] No image in Gemini response. Text parts:', textContent.slice(0, 300))
      console.error('[Generation] Full response structure:', JSON.stringify(data).slice(0, 500))
      return { success: false, error: `No image returned. Gemini said: ${textContent.slice(0, 200)}` }
    }

    const base64Data = imagePart.inlineData.data
    const mimeType = imagePart.inlineData.mimeType || 'image/png'
    return { success: true, imageUrl: `data:${mimeType};base64,${base64Data}` }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Main generation function
// referenceImageUrls: ordered list of image URLs (preset first, then manual refs)
export async function generateImage(
  prompt: string,
  config: { model: string; [key: string]: any },
  referenceImageUrls?: string[] | null
): Promise<GenerationResult> {
  console.log(`[Generation] generateImage called: model=${config.model}, refs=${referenceImageUrls?.length || 0}`)
  switch (config.model) {
    case 'nano_banana_pro': {
      return generateWithGemini(prompt, config as NanoBananaProConfig, referenceImageUrls || null)
    }
    default:
      return { success: false, error: `Unknown image model: ${config.model}` }
  }
}
