// API Key Management endpoint
// POST /api/keys — store API keys securely

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface KeyRequest {
  keyType: 'google' | 'fal' | 'kling_access' | 'kling_secret'
  value: string
}

// In-memory key override store (persists for server lifetime)
// In production, use a secrets manager or encrypted DB table
const keyOverrides: Map<string, string> = new Map()

// Key format validators
const KEY_VALIDATORS: Record<string, (v: string) => boolean> = {
  google: (v) => v.startsWith('AI') && v.length >= 30,
  fal: (v) => v.length >= 20,
  kling_access: (v) => v.length >= 10,
  kling_secret: (v) => v.length >= 10,
}

// Map key types to env variable names
const KEY_ENV_MAP: Record<string, string> = {
  google: 'GEMINI_API_KEY',
  fal: 'FAL_KEY',
  kling_access: 'KLING_ACCESS_KEY',
  kling_secret: 'KLING_SECRET_KEY',
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = (await req.json()) as KeyRequest

    if (!body.keyType || !body.value) {
      return NextResponse.json(
        { success: false, message: 'keyType and value are required' },
        { status: 400 }
      )
    }

    const validator = KEY_VALIDATORS[body.keyType]
    if (!validator) {
      return NextResponse.json(
        { success: false, message: `Unknown key type: ${body.keyType}` },
        { status: 400 }
      )
    }

    if (!validator(body.value)) {
      return NextResponse.json(
        { success: false, message: `Invalid format for ${body.keyType} key` },
        { status: 400 }
      )
    }

    // Store the key override
    const envName = KEY_ENV_MAP[body.keyType]
    keyOverrides.set(envName, body.value)

    // Also set in process.env for immediate use
    process.env[envName] = body.value

    console.log(`[Keys] ${body.keyType} key updated by ${session.user.email || 'unknown'}`)

    return NextResponse.json({
      success: true,
      message: `${body.keyType} key stored successfully. Active for this server session.`,
    })
  } catch (error) {
    console.error('[Keys] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/keys — check which keys are configured (no values exposed)
export async function GET() {
  const keyStatus: Record<string, boolean> = {}

  for (const [keyType, envName] of Object.entries(KEY_ENV_MAP)) {
    keyStatus[keyType] = !!(process.env[envName] || keyOverrides.get(envName))
  }

  return NextResponse.json({ keys: keyStatus })
}

// Export for use by other modules
export function getKey(envName: string): string | undefined {
  return keyOverrides.get(envName) || process.env[envName]
}
