const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const VISIONSTRUCT_PROMPT = `ROLE & OBJECTIVE
You are VisionStruct, an advanced Computer Vision & Data Serialization Engine. Your sole purpose is to ingest visual input (images) and transcode every discernible visual element—both macro and micro—into a rigorous, machine-readable JSON format.

CORE DIRECTIVE
Do not summarize. Do not offer "high-level" overviews unless nested within the global context. You must capture 100% of the visual data available in the image. If a detail exists in pixels, it must exist in your JSON output. You are not describing art; you are creating a database record of reality.

ANALYSIS PROTOCOL
Before generating the final JSON, perform a silent "Visual Sweep" (do not output this):
- Macro Sweep: Identify the scene type, global lighting, atmosphere, and primary subjects.
- Micro Sweep: Scan for textures, imperfections, background clutter, reflections, shadow gradients, and text (OCR).
- Relationship Sweep: Map the spatial and semantic connections between objects.

OUTPUT FORMAT (STRICT)
Return ONLY a single valid JSON object. No markdown fencing, no conversational filler.

{
  "meta": { "image_quality": "Low/Medium/High", "image_type": "Photo/Illustration/etc", "resolution_estimation": "string or null" },
  "global_context": {
    "scene_description": "A comprehensive, objective paragraph describing the entire scene.",
    "time_of_day": "string",
    "weather_atmosphere": "string",
    "lighting": { "source": "string", "direction": "string", "quality": "Hard/Soft/Diffused", "color_temp": "Warm/Cool/Neutral" }
  },
  "color_palette": { "dominant_hex_estimates": ["#RRGGBB"], "accent_colors": ["string"], "contrast_level": "High/Low/Medium" },
  "composition": {
    "camera_angle": "string",
    "framing": "string",
    "depth_of_field": "string",
    "focal_point": "string"
  },
  "objects": [
    {
      "id": "obj_001",
      "label": "Primary Object Name",
      "category": "Person/Vehicle/Furniture/etc",
      "location": "Center/Top-Left/etc",
      "prominence": "Foreground/Background",
      "visual_attributes": { "color": "string", "texture": "string", "material": "string", "state": "string", "dimensions_relative": "string" },
      "micro_details": ["string"],
      "pose_or_orientation": "string",
      "text_content": null
    }
  ],
  "text_ocr": { "present": true, "content": [{ "text": "string", "location": "string", "font_style": "string", "legibility": "string" }] },
  "semantic_relationships": ["string"]
}

CRITICAL CONSTRAINTS:
- Never say "a crowd of people" — list visible individuals as distinct objects
- Note scratches, dust, weather wear, specific fabric folds, subtle lighting gradients
- Set inapplicable fields to null rather than omitting them
- Objects array must include EVERY single visible item, no matter how small or background
- For the primary person: include detailed sub-attributes for face, hair, skin, clothing, accessories, expression, pose`

async function callGeminiVisionStruct(base64: string, mimeType: string): Promise<object> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

  const body = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: VISIONSTRUCT_PROMPT },
        ],
      },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[character-analyzer] Gemini API error:', response.status, errorText.slice(0, 300))
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)
  const rawText: string = textPart?.text || ''

  let jsonText = rawText.trim()
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) jsonText = fenceMatch[1].trim()

  try {
    return JSON.parse(jsonText)
  } catch {
    console.error('[character-analyzer] Failed to parse VisionStruct JSON from Gemini:', jsonText.slice(0, 300))
    throw new Error('Failed to parse VisionStruct JSON from Gemini response')
  }
}

/**
 * Map VisionStruct JSON → CharacterJson (our internal format for randomization + prompt building)
 * VisionStruct captures 100% of visual data — we just need to map it correctly.
 */
function visionStructToCharacterJson(vs: any): object {
  // Find the primary person (foreground subject)
  const person = vs.objects?.find((o: any) => o.category === 'Person' && o.prominence === 'Foreground')
    || vs.objects?.find((o: any) => o.category === 'Person')
    || {}

  const attrs = person.visual_attributes || {}
  const micro: string[] = person.micro_details || []
  const microStr = micro.join('; ')

  // Helper: find micro detail matching a keyword
  const findMicro = (...keywords: string[]) =>
    micro.find((m: string) => keywords.some(k => m.toLowerCase().includes(k))) || ''

  // Hair: search objects array for hair-related objects
  const hairObjects = (vs.objects || []).filter((o: any) =>
    o.label?.toLowerCase().includes('hair')
  )
  const hairObj = hairObjects[0]
  const hairFromObj = hairObj ? {
    color: hairObj.visual_attributes?.color || '',
    style: hairObj.visual_attributes?.texture || hairObj.micro_details?.find((m: string) =>
      /straight|wavy|curly|braided|bun|ponytail|afro|sleek|waves|layered|bob/i.test(m)
    ) || '',
    length: hairObj.micro_details?.find((m: string) =>
      /short|long|shoulder|medium|pixie|waist|chin/i.test(m)
    ) || hairObj.visual_attributes?.dimensions_relative || '',
  } : null

  // Clothing: combine person visual_attributes with clothing-specific objects
  const clothingLabels = ['shirt', 'pants', 'jeans', 'dress', 'jacket', 'top', 'skirt', 'shoes', 'boots', 'sneakers', 'blouse', 'coat', 'hoodie', 'sweater', 'shorts', 'trousers']
  const clothingObjects = (vs.objects || []).filter((o: any) =>
    clothingLabels.some(label => o.label?.toLowerCase().includes(label))
  )
  const clothingFromObjects = clothingObjects.map((o: any) => {
    const va = o.visual_attributes || {}
    return [o.label, va.color, va.material, va.texture].filter(Boolean).join(' ')
  }).join(', ')

  const personClothing = attrs.color
    ? `${attrs.color} ${attrs.material || ''} ${attrs.texture || ''}`.trim()
    : ''

  // Background: all non-foreground objects with location and color
  const bgObjects = (vs.objects || [])
    .filter((o: any) => o.id !== person.id && o.prominence !== 'Foreground')
    .map((o: any) => {
      const color = o.visual_attributes?.color ? ` (${o.visual_attributes.color})` : ''
      const loc = o.location ? ` — ${o.location}` : ''
      const details = (o.micro_details || []).length > 0 ? `: ${o.micro_details.slice(0, 2).join(', ')}` : ''
      return `${o.label}${color}${loc}${details}`
    })
    .join('; ')

  const comp = vs.composition || {}
  const lighting = vs.global_context?.lighting || {}
  const bgColors = (vs.color_palette?.accent_colors || []).join(', ')
  const sceneDesc = vs.global_context?.scene_description || ''

  return {
    // Appearance — all from person object in VisionStruct
    age: parseInt(findMicro('year', 'age', 'yr')) || 25,
    ethnicity_appearance: findMicro('ethnicity', 'asian', 'black', 'latino', 'white', 'indian', 'arab', 'mixed')
      || (sceneDesc.match(/\b(asian|african|latina|european|middle eastern|south asian|indian)\b/i)?.[0])
      || attrs.texture || 'person',
    skin_tone: findMicro('skin', 'complexion', 'tone') || attrs.color || '',
    physical_build: attrs.dimensions_relative || findMicro('slim', 'athletic', 'petite', 'curvy', 'build') || '',
    hair_color: hairFromObj?.color || findMicro('hair color', 'blonde', 'brunette', 'black hair', 'red hair', 'brown hair', 'dyed') || '',
    hair_style: hairFromObj?.style || findMicro('hair style', 'straight', 'wavy', 'curly', 'bun', 'ponytail', 'braids') || '',
    hair_length: hairFromObj?.length || findMicro('hair length', 'short hair', 'long hair', 'shoulder', 'pixie') || '',
    clothing: clothingFromObjects || personClothing || findMicro('wearing', 'shirt', 'dress', 'jeans', 'top', 'outfit', 'clothing') || '',
    accessories: findMicro('earring', 'necklace', 'bracelet', 'ring', 'glasses', 'hat', 'watch', 'accessory') || 'none',
    makeup: findMicro('makeup', 'lipstick', 'mascara', 'foundation', 'eyeliner', 'lash', 'glam') || 'none/minimal',

    // Pose — from person's pose_or_orientation and micro details
    pose: {
      body_position: person.pose_or_orientation?.split(',')[0] || '',
      facing: person.pose_or_orientation?.split(',')[1]?.trim() || '',
      hand_position: findMicro('hand', 'arm', 'wrist', 'holding', 'gestur') || '',
      posture: person.pose_or_orientation?.split(',')[2]?.trim() || '',
    },

    // Camera — from composition block (VisionStruct's strong suit)
    camera: {
      angle: comp.camera_angle || '',
      distance: comp.framing || '',
      depth_of_field: comp.depth_of_field || '',
      framing: comp.focal_point || '',
    },

    // Expression — from micro details about face
    expression: {
      facial_expression: findMicro('expression', 'smile', 'smirk', 'neutral', 'laugh', 'pout', 'stare') || '',
      eye_contact: findMicro('eye contact', 'looking', 'gaze', 'eyes directed') || '',
      energy: findMicro('energy', 'confident', 'playful', 'calm', 'mysterious', 'friendly', 'intense') || '',
    },

    // Environment — full background detail from VisionStruct objects list
    environment: {
      setting: sceneDesc.split('.')[0] || '',
      background_objects: bgObjects,
      background_colors: bgColors,
      background_blur: comp.depth_of_field || '',
    },

    // Lighting — from global_context.lighting (VisionStruct captures this precisely)
    lighting: {
      type: lighting.source || '',
      direction: lighting.direction || '',
      mood: [lighting.quality, lighting.color_temp].filter(Boolean).join(', '),
    },

    photography_style: vs.meta?.image_type || '',

    // Full VisionStruct kept for debugging
    _visionStruct: vs,
  }
}

// Removed: two-pass approach was redundant — VisionStruct captures everything in one pass
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _unused_extractCharacterDetails(vsJson: any): Promise<object> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

  const sceneDesc = vsJson.global_context?.scene_description || ''
  const personObj = vsJson.objects?.find((o: any) => o.category === 'Person' && o.prominence === 'Foreground')
    || vsJson.objects?.find((o: any) => o.category === 'Person') || {}

  const prompt = `Based on this detailed scene analysis, extract specific character appearance details.

Scene description: ${sceneDesc}
Person object data: ${JSON.stringify(personObj, null, 2)}

Return ONLY this JSON (no markdown, no explanation):
{
  "age": <estimated number or 25 if unknown>,
  "ethnicity_appearance": "<specific ethnicity: East Asian, African American, Latina, South Asian, Middle Eastern, Northern European, mixed, etc>",
  "skin_tone": "<specific: e.g. light ivory with warm undertones, deep brown, medium olive, fair>",
  "physical_build": "<specific: slim, athletic, petite, curvy, average>",
  "hair_color": "<exact: e.g. jet black, platinum blonde, warm auburn, dark brown with highlights>",
  "hair_style": "<exact: straight sleek, loose beach waves, tight curls, half-up ponytail, messy bun>",
  "hair_length": "<exact: pixie, chin length, shoulder length, mid-back, waist length>",
  "clothing": "<detailed description of ALL clothing items, colors, patterns, fit>",
  "accessories": "<list all: earrings, necklaces, bracelets, glasses, hats — or 'none'>",
  "makeup": "<detailed makeup description — or 'none/minimal'>",
  "facial_expression": "<exact: neutral, soft smile, intense stare, smirk, laughing>",
  "eye_contact": "<exact: direct eye contact, looking off camera left, looking down>",
  "energy": "<exact: calm, confident, playful, mysterious, friendly>",
  "body_position": "<exact: seated in gaming chair, standing upright, leaning against wall>",
  "facing": "<exact: directly facing camera, turned slightly left, 3/4 angle>",
  "hand_position": "<exact: hands on lap, arms crossed, gesturing>",
  "posture": "<exact: relaxed, upright, slouched>"
}`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  }

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`Gemini character extract error: ${response.status}`)

  const data = await response.json()
  const rawText: string = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || ''
  let jsonText = rawText.trim()
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) jsonText = fenceMatch[1].trim()

  try {
    return JSON.parse(jsonText)
  } catch {
    console.error('[character-analyzer] Failed to parse character details:', jsonText.slice(0, 300))
    return {}
  }
}

/**
 * Single-pass analysis: VisionStruct captures everything.
 * Maps directly to CharacterJson — no second Gemini call needed.
 */
async function runFullAnalysis(base64: string, mimeType: string): Promise<object> {
  const vsJson = await callGeminiVisionStruct(base64, mimeType) as any
  return visionStructToCharacterJson(vsJson)
}

/**
 * Analyze a character image from raw base64 + mimeType.
 */
export async function analyzeCharacterFromBase64(base64: string, mimeType: string): Promise<object> {
  return runFullAnalysis(base64, mimeType)
}

/**
 * Analyze a character image from a URL (http/https or relative path).
 * For relative paths (starting with /), reads directly from disk to avoid self-fetch issues.
 * For absolute URLs, fetches via HTTP.
 */
export async function analyzeCharacterImage(imageUrl: string): Promise<object> {
  let base64: string
  let mimeType: string

  if (imageUrl.startsWith('/')) {
    const { readFile } = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'public', imageUrl)
    const buffer = await readFile(filePath)
    base64 = buffer.toString('base64')
    const ext = path.extname(imageUrl).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.webp': 'image/webp',
      '.gif': 'image/gif',
    }
    mimeType = mimeMap[ext] || 'image/jpeg'
  } else {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
    const bytes = await res.arrayBuffer()
    base64 = Buffer.from(bytes).toString('base64')
    mimeType = res.headers.get('content-type') || 'image/jpeg'
  }

  return runFullAnalysis(base64, mimeType)
}
