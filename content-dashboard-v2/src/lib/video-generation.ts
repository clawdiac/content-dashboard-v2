// Video generation service — Seedance (fal.ai) + Kling AI (direct API with JWT)

import { fal } from '@fal-ai/client'
import jwt from 'jsonwebtoken'

import type { SeedanceConfig, KlingConfig } from './models/types'
import { mapSeedanceRequest, mapKlingRequest } from './models/mapper'
import { mapProviderError } from './models/errors'

// ============ Types ============

export type VideoModel = 'seedance' | 'kling'

export interface VideoGenerationResult {
  success: boolean
  videoUrl?: string
  requestId?: string
  status?: 'completed' | 'processing' | 'failed'
  error?: string
}

// ============ Seedance via fal.ai ============

const FAL_KEY = process.env.FAL_KEY

function initFal() {
  if (FAL_KEY) {
    fal.config({ credentials: FAL_KEY })
  }
}

function getFalStatusCode(error: unknown): number | null {
  const anyErr = error as any
  return typeof anyErr?.status === 'number'
    ? anyErr.status
    : typeof anyErr?.statusCode === 'number'
      ? anyErr.statusCode
      : null
}

export async function generateWithSeedance(
  prompt: string,
  config: SeedanceConfig,
  referenceImageUrl?: string | null
): Promise<VideoGenerationResult> {
  if (!FAL_KEY) {
    return { success: false, error: 'FAL_KEY not configured. Set FAL_KEY environment variable.' }
  }

  initFal()

  try {
    const { modelId, input } = mapSeedanceRequest(prompt, config, referenceImageUrl)

    console.log(`[VideoGen] Seedance ${referenceImageUrl ? 'I2V' : 'T2V'} — model: ${modelId}`)
    console.log(`[VideoGen] Input:`, JSON.stringify(input, null, 2))

    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          const logs = (update as any).logs
          if (logs) {
            logs.map((log: any) => log.message).forEach((msg: string) => {
              console.log(`[VideoGen] Seedance progress: ${msg}`)
            })
          }
        }
      },
    })

    const data = result.data as any
    if (data?.video?.url) {
      console.log(`[VideoGen] Seedance success: ${data.video.url}`)
      return {
        success: true,
        videoUrl: data.video.url,
        requestId: result.requestId,
        status: 'completed',
      }
    }

    return { success: false, error: 'No video URL in Seedance response' }
  } catch (error) {
    const statusCode = getFalStatusCode(error) ?? 500
    const body = error instanceof Error ? error.message : 'Seedance generation failed'
    const mapped = mapProviderError('fal', statusCode, body)
    console.error('[VideoGen] Seedance error:', error)
    return {
      success: false,
      error: mapped.message,
    }
  }
}

// ============ Kling AI (Direct API with JWT) ============

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY
const KLING_API_BASE = 'https://api.klingai.com'

class KlingApiError extends Error {
  statusCode: number
  body: string

  constructor(statusCode: number, body: string) {
    super(`Kling API error ${statusCode}`)
    this.statusCode = statusCode
    this.body = body
  }
}

function generateKlingJWT(): string {
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    throw new Error('KLING_ACCESS_KEY and KLING_SECRET_KEY must be set')
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: now + 1800,
    nbf: now - 5,
  }

  return jwt.sign(payload, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' },
  })
}

async function klingRequest(path: string, body?: any): Promise<any> {
  const token = generateKlingJWT()
  const url = `${KLING_API_BASE}${path}`

  const options: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    const text = await response.text()
    throw new KlingApiError(response.status, text)
  }

  return response.json()
}

export async function generateWithKling(
  prompt: string,
  config: KlingConfig,
  referenceImageUrl?: string | null
): Promise<VideoGenerationResult> {
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    return { success: false, error: 'KLING_ACCESS_KEY and KLING_SECRET_KEY not configured.' }
  }

  try {
    const { endpoint, body } = mapKlingRequest(prompt, config, referenceImageUrl)

    console.log(`[VideoGen] Kling ${referenceImageUrl ? 'I2V' : 'T2V'} — endpoint: ${endpoint}`)

    const submitResult = await klingRequest(endpoint, body)
    const taskId = submitResult?.data?.task_id

    if (!taskId) {
      return { success: false, error: `No task_id returned from Kling API. Response: ${JSON.stringify(submitResult)}` }
    }

    console.log(`[VideoGen] Kling task submitted: ${taskId}`)

    const pollPath = referenceImageUrl
      ? `/v1/videos/image2video/${taskId}`
      : `/v1/videos/text2video/${taskId}`

    const maxAttempts = 60
    const pollInterval = 5000

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const statusResult = await klingRequest(pollPath)
      const taskStatus = statusResult?.data?.task_status

      console.log(`[VideoGen] Kling poll ${i + 1}/${maxAttempts}: status=${taskStatus}`)

      if (taskStatus === 'succeed') {
        const videoUrl = statusResult?.data?.task_result?.videos?.[0]?.url
        if (videoUrl) {
          return {
            success: true,
            videoUrl,
            requestId: taskId,
            status: 'completed',
          }
        }
        return { success: false, error: 'Kling task succeeded but no video URL found' }
      }

      if (taskStatus === 'failed') {
        const failMsg = statusResult?.data?.task_status_msg || 'Unknown failure'
        return { success: false, error: `Kling generation failed: ${failMsg}` }
      }
    }

    return { success: false, error: 'Kling generation timed out after 5 minutes', requestId: taskId, status: 'processing' }
  } catch (error) {
    if (error instanceof KlingApiError) {
      const mapped = mapProviderError('kling', error.statusCode, error.body)
      return { success: false, error: mapped.message }
    }

    console.error('[VideoGen] Kling error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kling generation failed',
    }
  }
}

// ============ Main Router ============

export async function generateVideo(
  prompt: string,
  config: SeedanceConfig | KlingConfig,
  referenceImageUrl?: string | null
): Promise<VideoGenerationResult> {
  switch (config.model) {
    case 'seedance':
      return generateWithSeedance(prompt, config, referenceImageUrl)
    case 'kling':
      return generateWithKling(prompt, config, referenceImageUrl)
    default:
      return { success: false, error: `Unknown video model: ${(config as any).model}` }
  }
}
