// Video generation service — Seedance (BytePlus ModelArk) + Kling AI (direct API with JWT)
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

// ============ Seedance via BytePlus ModelArk ============

const BYTEDANCE_API_KEY = process.env.BYTEDANCE_API_KEY
const BYTEDANCE_API_BASE = 'https://ark.ap-southeast.bytepluses.com/api/v3'

class ByteDanceApiError extends Error {
  statusCode: number
  body: string

  constructor(statusCode: number, body: string) {
    super(`ByteDance API error ${statusCode}`)
    this.statusCode = statusCode
    this.body = body
  }
}

async function bytedanceRequest(path: string, body?: any): Promise<any> {
  if (!BYTEDANCE_API_KEY) {
    throw new Error('BYTEDANCE_API_KEY must be set')
  }

  const url = `${BYTEDANCE_API_BASE}${path}`
  const options: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BYTEDANCE_API_KEY}`,
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    const text = await response.text()
    throw new ByteDanceApiError(response.status, text)
  }

  return response.json()
}

export async function generateWithSeedance(
  prompt: string,
  config: SeedanceConfig,
  referenceImageUrl?: string | null
): Promise<VideoGenerationResult> {
  if (!BYTEDANCE_API_KEY) {
    return { success: false, error: 'BYTEDANCE_API_KEY not configured. Set BYTEDANCE_API_KEY environment variable.' }
  }

  try {
    const { endpoint, body } = mapSeedanceRequest(prompt, config, referenceImageUrl)

    console.log(`[VideoGen] Seedance ${referenceImageUrl ? 'I2V' : 'T2V'} — endpoint: ${endpoint}`)
    console.log(`[VideoGen] Input:`, JSON.stringify(body, null, 2))

    const submitResult = await bytedanceRequest(endpoint, body)
    const taskId =
      submitResult?.task_id ||
      submitResult?.id ||
      submitResult?.data?.task_id ||
      submitResult?.data?.id

    if (!taskId) {
      return { success: false, error: `No task_id returned from BytePlus API. Response: ${JSON.stringify(submitResult)}` }
    }

    console.log(`[VideoGen] Seedance task submitted: ${taskId}`)

    const maxAttempts = 120
    const pollInterval = 3000

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const statusResult = await bytedanceRequest(`/contents/generations/tasks/${taskId}`)
      const taskStatus = statusResult?.status

      console.log(`[VideoGen] Seedance poll ${i + 1}/${maxAttempts}: status=${taskStatus}`)

      if (taskStatus === 'succeeded') {
        const content = Array.isArray(statusResult?.content) ? statusResult.content : []
        const videoItem = content.find((item: any) => item?.type === 'video')
        const videoUrl = videoItem?.video?.url
        if (videoUrl) {
          return {
            success: true,
            videoUrl,
            requestId: taskId,
            status: 'completed',
          }
        }
        return { success: false, error: 'Seedance task succeeded but no video URL found', requestId: taskId, status: 'failed' }
      }

      if (taskStatus === 'failed') {
        const failMsg = statusResult?.error?.message || statusResult?.message || 'Unknown failure'
        return { success: false, error: `Seedance generation failed: ${failMsg}`, requestId: taskId, status: 'failed' }
      }
    }

    return { success: false, error: 'Seedance generation timed out after 6 minutes', requestId: taskId, status: 'processing' }
  } catch (error) {
    if (error instanceof ByteDanceApiError) {
      const mapped = mapProviderError('bytedance', error.statusCode, error.body)
      return { success: false, error: mapped.message }
    }

    console.error('[VideoGen] Seedance error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Seedance generation failed',
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
