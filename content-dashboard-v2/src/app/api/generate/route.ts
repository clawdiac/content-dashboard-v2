import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/generation'
import { requireApiAuth } from '@/lib/api-auth'
import { MODEL_DEFAULTS, type ModelConfig, type NanoBananaProConfig, type NanoBanana2Config } from '@/lib/models'
import { validateModelConfig } from '@/lib/models/validator'
import path from 'path'
import fs from 'fs'

const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated')

if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true })
}

const CHARACTER_PRESETS: Record<string, string> = {
  'goldman': '/uploads/references/1771243079788-ComfyUI_00041_.png',
  'podcast_host': '/uploads/references/1771243079788-ComfyUI_00041_.png',
}

async function uploadToImgbb(base64Data: string): Promise<string | null> {
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY
  if (!IMGBB_API_KEY) {
    console.log('[Generate] No IMGBB_API_KEY, using local file')
    return null
  }

  try {
    const formData = new FormData()
    formData.append('image', base64Data)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (data.success) {
      return data.data.url
    }
    console.error('[Generate] ImgBB upload failed:', data)
    return null
  } catch (error) {
    console.error('[Generate] ImgBB upload error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireApiAuth()
  if (authError) return authError

  try {
    const body = await request.json()

    const {
      prompt,
      negativePrompt,
      modelConfig,
      model = 'nano_banana_pro',
      aspectRatio = '9:16',
      quality = '2K',
      numImages = 1,
      referenceImageUrl = null,
      character = null,
    } = body as any

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    let resolvedReferenceUrl = referenceImageUrl
    if (character && CHARACTER_PRESETS[character.toLowerCase()]) {
      const refPath = CHARACTER_PRESETS[character.toLowerCase()]
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
      resolvedReferenceUrl = `${baseUrl}${refPath}`
      console.log(`[Generate] Using character preset: ${character} -> ${resolvedReferenceUrl}`)
    }

    let resolvedConfig: ModelConfig
    if (modelConfig) {
      resolvedConfig = modelConfig as ModelConfig
    } else {
      if (model === 'nano_banana_2') {
        const base = MODEL_DEFAULTS.nano_banana_2 as NanoBanana2Config
        resolvedConfig = {
          ...base,
          aspect_ratio: aspectRatio as NanoBanana2Config['aspect_ratio'],
          resolution: quality as NanoBanana2Config['resolution'],
          num_images: numImages as NanoBanana2Config['num_images'],
        }
      } else {
        const base = MODEL_DEFAULTS.nano_banana_pro as NanoBananaProConfig
        resolvedConfig = {
          ...base,
          aspect_ratio: aspectRatio as NanoBananaProConfig['aspect_ratio'],
          resolution: quality as NanoBananaProConfig['resolution'],
          num_images: numImages as NanoBananaProConfig['num_images'],
        }
      }
    }

    if (model === 'nano_banana_pro' && resolvedConfig.model !== 'nano_banana_pro') {
      resolvedConfig = { ...(resolvedConfig as any), model: 'nano_banana_pro' }
    }
    if (model === 'nano_banana_2' && resolvedConfig.model !== 'nano_banana_2') {
      resolvedConfig = { ...(resolvedConfig as any), model: 'nano_banana_2' }
    }

    const validation = validateModelConfig(resolvedConfig)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join('; ') }, { status: 400 })
    }

    if (resolvedConfig.model !== 'nano_banana_pro' && resolvedConfig.model !== 'nano_banana_2') {
      return NextResponse.json(
        { error: 'This endpoint only supports Nano Banana image generation.' },
        { status: 400 }
      )
    }

    const result = await generateImage(prompt, resolvedConfig as NanoBananaProConfig | NanoBanana2Config, resolvedReferenceUrl)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    const base64Data = result.imageUrl!.replace(/^data:image\/\w+;base64,/, '')

    const timestamp = Date.now()
    const filename = `gen_${timestamp}.jpg`
    const filepath = path.join(GENERATED_DIR, filename)
    const imageBuffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filepath, imageBuffer)

    const localUrl = `/generated/${filename}`
    const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}${localUrl}`

    let publicUrl = fullUrl
    const imgbbUrl = await uploadToImgbb(base64Data)
    if (imgbbUrl) {
      publicUrl = imgbbUrl
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      localUrl: fullUrl,
      metadata: {
        model: resolvedConfig.model,
        aspectRatio: (resolvedConfig as NanoBananaProConfig | NanoBanana2Config).aspect_ratio,
        quality: (resolvedConfig as NanoBananaProConfig | NanoBanana2Config).resolution,
        prompt,
        negativePrompt,
      },
    })
  } catch (error) {
    console.error('[API /api/generate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
