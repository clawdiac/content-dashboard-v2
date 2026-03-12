export interface CharacterJson {
  age?: number
  ethnicity_appearance?: string
  skin_tone?: string
  hair_color?: string
  hair_style?: string
  hair_length?: string
  clothing?: string
  accessories?: string
  makeup?: string
  expression?: string | {
    facial_expression?: string
    eye_contact?: string
    energy?: string
  }
  physical_build?: string
  eye_color?: string
  eye_shape?: string
  face_shape?: string
  skin_detail?: string
  lip_style?: string
  eyebrow_style?: string
  pose?: {
    body_position?: string
    facing?: string
    hand_position?: string
    posture?: string
  }
  camera?: {
    angle?: string
    distance?: string
    depth_of_field?: string
    framing?: string
  }
  environment?: {
    setting?: string
    background?: string
    background_blur?: string
  }
  lighting?: {
    type?: string
    direction?: string
    mood?: string
  }
  photography_style?: string
  [key: string]: unknown
}

export interface RandomizeConfig {
  ethnicity: { enabled: boolean; description?: string }
  hairstyle: { enabled: boolean; description?: string }
  clothes: { enabled: boolean; description: string }
}

const ETHNICITIES = [
  { ethnicity_appearance: 'East Asian', skin_tone: 'light porcelain', natural_hair_colors: ['jet black', 'dark brown', 'black'] },
  { ethnicity_appearance: 'South Asian', skin_tone: 'warm medium brown', natural_hair_colors: ['jet black', 'dark brown', 'black'] },
  { ethnicity_appearance: 'Southeast Asian', skin_tone: 'golden tan', natural_hair_colors: ['jet black', 'dark brown', 'black'] },
  { ethnicity_appearance: 'African', skin_tone: 'rich dark brown', natural_hair_colors: ['black', 'dark brown', 'jet black'] },
  { ethnicity_appearance: 'West African', skin_tone: 'deep ebony', natural_hair_colors: ['black', 'jet black', 'dark brown'] },
  { ethnicity_appearance: 'Latina', skin_tone: 'warm olive', natural_hair_colors: ['dark brown', 'black', 'warm chestnut', 'rich auburn'] },
  { ethnicity_appearance: 'Middle Eastern', skin_tone: 'warm beige', natural_hair_colors: ['jet black', 'dark brown', 'dark espresso brown'] },
  { ethnicity_appearance: 'Mediterranean', skin_tone: 'olive tan', natural_hair_colors: ['dark brown', 'black', 'warm chestnut'] },
  { ethnicity_appearance: 'Northern European', skin_tone: 'fair ivory', natural_hair_colors: ['blonde', 'light brown', 'strawberry blonde', 'platinum blonde'] },
  { ethnicity_appearance: 'Eastern European', skin_tone: 'light peachy', natural_hair_colors: ['dark blonde', 'light brown', 'chestnut', 'auburn'] },
  { ethnicity_appearance: 'Mixed heritage', skin_tone: 'warm caramel', natural_hair_colors: ['dark brown', 'warm chestnut', 'light brown with highlights', 'caramel brown'] },
  { ethnicity_appearance: 'Indigenous American', skin_tone: 'warm copper', natural_hair_colors: ['jet black', 'dark brown', 'black'] },
  { ethnicity_appearance: 'Pacific Islander', skin_tone: 'golden brown', natural_hair_colors: ['black', 'dark brown', 'jet black'] },
]

// Hair styles — color only used when ethnicity is NOT separately randomized
const HAIRSTYLES = [
  { hair_color: 'black', hair_style: 'sleek straight', hair_length: 'long' },
  { hair_color: 'dark brown', hair_style: 'loose waves', hair_length: 'shoulder length' },
  { hair_color: 'dark brown', hair_style: 'curly', hair_length: 'medium' },
  { hair_color: 'black', hair_style: 'braids', hair_length: 'long' },
  { hair_color: 'auburn', hair_style: 'wavy', hair_length: 'shoulder length' },
  { hair_color: 'dark brown', hair_style: 'straight', hair_length: 'short bob' },
  { hair_color: 'black', hair_style: 'beach waves', hair_length: 'long' },
  { hair_color: 'dark brown', hair_style: 'afro curls', hair_length: 'medium' },
  { hair_color: 'chestnut', hair_style: 'loose waves', hair_length: 'long' },
  { hair_color: 'black', hair_style: 'high ponytail', hair_length: 'long' },
  { hair_color: 'dark brown', hair_style: 'half-up half-down', hair_length: 'long' },
  { hair_color: 'black', hair_style: 'sleek straight', hair_length: 'very long' },
  { hair_color: 'dark brown', hair_style: 'messy bun', hair_length: 'medium' },
  { hair_color: 'chestnut', hair_style: 'curtain bangs', hair_length: 'long' },
]

const ETHNICITY_EYE_COLORS: Record<string, string[]> = {
  'East Asian': ['dark brown', 'black-brown', 'warm brown'],
  'South Asian': ['dark brown', 'black-brown', 'warm brown'],
  'Southeast Asian': ['dark brown', 'black-brown'],
  'African': ['dark brown', 'black-brown', 'deep brown'],
  'West African': ['dark brown', 'black-brown'],
  'Latina': ['brown', 'dark brown', 'hazel', 'warm brown'],
  'Middle Eastern': ['dark brown', 'brown', 'hazel', 'amber'],
  'Mediterranean': ['brown', 'hazel', 'green', 'amber'],
  'Northern European': ['blue', 'green', 'grey', 'hazel', 'blue-grey'],
  'Eastern European': ['blue', 'green', 'hazel', 'grey', 'light brown'],
  'Mixed heritage': ['brown', 'hazel', 'green', 'amber', 'grey-green'],
  'Indigenous American': ['dark brown', 'black-brown', 'warm brown'],
  'Pacific Islander': ['dark brown', 'black-brown', 'brown'],
}

const DEFAULT_EYE_COLORS = ['brown', 'dark brown', 'hazel', 'green', 'blue', 'grey', 'amber', 'dark grey', 'blue-grey']

const EYE_SHAPES = ['almond-shaped', 'round', 'hooded', 'wide-set', 'close-set', 'deep-set', 'upturned', 'doe eyes']

const FACE_SHAPES = ['oval face', 'heart-shaped face', 'round face', 'square jaw', 'soft angular features', 'high cheekbones', 'soft rounded features', 'defined cheekbones']

const SKIN_DETAILS = ['smooth clear skin', 'natural soft skin with subtle pores', 'light natural freckles', 'soft skin with faint beauty mark near lip', 'dewy glowing skin', 'matte smooth complexion']

const LIP_STYLES = ['full lips', 'naturally defined lips', 'soft subtle lips', 'wide smile-ready lips', 'bow-shaped lips']

const EYEBROW_STYLES = ['naturally full brows', 'arched defined brows', 'straight flat brows', 'soft feathered brows', 'bold thick brows']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Apply randomization overrides to a base character JSON.
 */
export function applyRandomization(
  base: CharacterJson,
  config: RandomizeConfig
): CharacterJson {
  const result = { ...base }

  if (config.ethnicity.enabled) {
    if (config.ethnicity.description) {
      result.ethnicity_appearance = config.ethnicity.description
      // When user describes ethnicity, also adapt hair color unless hairstyle is separately randomized
      if (!config.hairstyle.enabled) {
        // Try to match a known ethnicity from description for hair color hints
        const matchedEthnicity = ETHNICITIES.find(e =>
          config.ethnicity.description!.toLowerCase().includes(e.ethnicity_appearance.toLowerCase())
        )
        if (matchedEthnicity) {
          result.hair_color = pickRandom(matchedEthnicity.natural_hair_colors)
        }
      }
    } else {
      const pick = pickRandom(ETHNICITIES)
      result.ethnicity_appearance = pick.ethnicity_appearance
      result.skin_tone = pick.skin_tone
      // Always adapt hair color to match ethnicity (unless hairstyle is separately enabled)
      if (!config.hairstyle.enabled) {
        result.hair_color = pickRandom(pick.natural_hair_colors)
      }
    }
  }

  if (config.hairstyle.enabled) {
    if (config.hairstyle.description) {
      // User described a style — apply style only, preserve ethnicity-derived hair_color
      result.hair_style = config.hairstyle.description
      result.hair_length = base.hair_length
      // Only use base hair_color if ethnicity didn't already set it
      if (!config.ethnicity.enabled) {
        result.hair_color = base.hair_color
      }
    } else {
      const pick = pickRandom(HAIRSTYLES)
      // Only take hair_color from HAIRSTYLES if ethnicity is NOT also being randomized
      // When ethnicity IS randomized, ethnicity determines hair_color — hairstyle only picks style/length
      if (!config.ethnicity.enabled) {
        result.hair_color = pick.hair_color
      }
      result.hair_style = pick.hair_style
      result.hair_length = pick.hair_length
    }
  }

  if (config.clothes.enabled && config.clothes.description) {
    result.clothing = config.clothes.description
  }

  // Always randomize additional diversity attributes
  const ethnicity = result.ethnicity_appearance || base.ethnicity_appearance || ''
  const eyeColors = ETHNICITY_EYE_COLORS[ethnicity] || DEFAULT_EYE_COLORS
  result.eye_color = pickRandom(eyeColors)
  result.eye_shape = pickRandom(EYE_SHAPES)
  result.face_shape = pickRandom(FACE_SHAPES)
  result.skin_detail = pickRandom(SKIN_DETAILS)
  result.lip_style = pickRandom(LIP_STYLES)
  result.eyebrow_style = pickRandom(EYEBROW_STYLES)

  // Age variation: ±2 years from base age (tight range, no dramatic shifts)
  if (base.age) {
    const offset = Math.floor(Math.random() * 5) - 2 // -2 to +2
    result.age = Math.max(18, base.age + offset)
  }

  return result
}

/**
 * Generate N variations of a base character JSON.
 */
export function generateVariations(
  base: CharacterJson,
  config: RandomizeConfig,
  count: number
): CharacterJson[] {
  const results: CharacterJson[] = []
  for (let i = 0; i < count; i++) {
    let variation: CharacterJson
    let attempts = 0
    do {
      variation = applyRandomization(base, config)
      attempts++
    } while (
      attempts < 5 &&
      results.some(r =>
        r.ethnicity_appearance === variation.ethnicity_appearance &&
        r.hair_color === variation.hair_color &&
        r.hair_style === variation.hair_style &&
        r.eye_color === variation.eye_color &&
        r.face_shape === variation.face_shape
      )
    )
    results.push(variation)
  }
  return results
}
