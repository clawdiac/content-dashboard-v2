import type { CharacterJson } from './character-randomizer'

/**
 * Build a rich, detailed image generation prompt from a character JSON object.
 * This prompt is the SOLE input to image generation (no reference image is passed).
 * It must include ALL compositional attributes (pose, camera, lighting, setting, expression)
 * to faithfully reproduce the reference image's composition with only the randomized attributes changed.
 */
export function buildCharacterPrompt(character: CharacterJson): string {
  // Nano Banana skews older — compensate by prompting younger-sounding language
  // e.g. age 25 → "early 20s", age 28 → "mid 20s", age 30 → "late 20s"
  function ageToPhrase(a: number): string {
    if (a <= 20) return 'early 20s'
    if (a <= 23) return 'early 20s'
    if (a <= 26) return 'mid 20s'
    if (a <= 29) return 'late 20s'
    if (a <= 32) return 'early 30s'
    if (a <= 36) return 'mid 30s'
    return 'late 30s'
  }
  const age = character.age ? ageToPhrase(character.age) : 'early 20s'
  const ethnicity = character.ethnicity_appearance || 'person'
  const build = character.physical_build ? `, ${character.physical_build} build` : ''
  const skinTone = character.skin_tone ? `, ${character.skin_tone} skin` : ''

  const hairColor = character.hair_color || ''
  const hairStyle = character.hair_style || ''
  const hairLength = character.hair_length || ''
  const hairDesc = [hairLength, hairStyle, hairColor].filter(Boolean).join(' ')
  const hair = hairDesc ? `${hairDesc} hair` : ''

  // Diversity attributes
  const eyeColor = character.eye_color || ''
  const eyeShape = character.eye_shape || ''
  const eyeDesc = [eyeColor, eyeShape].filter(Boolean).join(' ')
  const eyes = eyeDesc ? `${eyeDesc} eyes` : ''

  const faceShape = character.face_shape || ''
  const skinDetail = character.skin_detail || ''
  const lipStyle = character.lip_style || ''
  const eyebrowStyle = character.eyebrow_style || ''

  const clothing = character.clothing ? `Wearing ${character.clothing}.` : ''
  const accessories = character.accessories && character.accessories.toLowerCase() !== 'none'
    ? `Accessories: ${character.accessories}.` : ''
  const makeup = character.makeup && character.makeup.toLowerCase() !== 'none' && character.makeup.toLowerCase() !== 'none/minimal'
    ? `Makeup: ${character.makeup}.` : ''

  // Expression - handle both string (legacy) and object (new) formats
  let expressionDesc = ''
  if (typeof character.expression === 'object' && character.expression) {
    const parts = []
    if (character.expression.facial_expression) parts.push(character.expression.facial_expression)
    if (character.expression.eye_contact) parts.push(character.expression.eye_contact)
    if (character.expression.energy) parts.push(`${character.expression.energy} energy`)
    expressionDesc = parts.length > 0 ? `Expression: ${parts.join(', ')}.` : ''
  } else if (typeof character.expression === 'string') {
    expressionDesc = `Expression: ${character.expression}.`
  }

  // Pose
  let poseDesc = ''
  if (character.pose) {
    const parts = []
    if (character.pose.body_position) parts.push(character.pose.body_position)
    if (character.pose.facing) parts.push(character.pose.facing)
    if (character.pose.hand_position) parts.push(character.pose.hand_position)
    if (character.pose.posture) parts.push(`${character.pose.posture} posture`)
    poseDesc = parts.length > 0 ? `Pose: ${parts.join(', ')}.` : ''
  }

  // Camera
  let cameraDesc = ''
  if (character.camera) {
    const parts = []
    if (character.camera.angle) parts.push(`${character.camera.angle} angle`)
    if (character.camera.distance) parts.push(character.camera.distance)
    if (character.camera.depth_of_field) parts.push(`${character.camera.depth_of_field} depth of field`)
    if (character.camera.framing) parts.push(`${character.camera.framing} framing`)
    cameraDesc = parts.length > 0 ? `Camera: ${parts.join(', ')}.` : ''
  }

  // Lighting
  let lightingDesc = ''
  if (character.lighting) {
    const parts = []
    if (character.lighting.type) parts.push(character.lighting.type)
    if (character.lighting.direction) parts.push(`from ${character.lighting.direction}`)
    if (character.lighting.mood) parts.push(`${character.lighting.mood} mood`)
    lightingDesc = parts.length > 0 ? `Lighting: ${parts.join(', ')}.` : ''
  }

  // Environment / Setting
  let settingDesc = ''
  if (character.environment) {
    const parts = []
    if (character.environment.setting) parts.push(character.environment.setting)
    if ((character.environment as any).background_objects) {
      parts.push(`Background elements: ${(character.environment as any).background_objects}`)
    }
    else if (character.environment.background) parts.push(character.environment.background)
    if ((character.environment as any).background_colors) parts.push(`background colors: ${(character.environment as any).background_colors}`)
    if (character.environment.background_blur) parts.push(`background ${character.environment.background_blur}`)
    settingDesc = parts.length > 0 ? `Setting: ${parts.join('. ')}.` : ''
  }

  // Photography style
  const styleDesc = character.photography_style
    ? `Photography style: ${character.photography_style}.`
    : ''

  // Build subject line
  // Build appearance details string
  const appearanceDetails = [eyes, faceShape, lipStyle, eyebrowStyle, skinDetail].filter(Boolean).join(', ')
  const appearanceStr = appearanceDetails ? `, ${appearanceDetails}` : ''
  const subjectLine = `Hyperrealistic photo of a beautiful ${age}${build} ${ethnicity} woman${skinTone} with ${hair}${appearanceStr}. Striking features, naturally attractive, flawless skin.`

  // Scene recreation instruction — forces model to match exact composition
  const sceneInstruction = `Recreate this exact scene and composition with this person instead. Same pose, same camera angle, same background setting, same lighting, same framing. Only the person's appearance differs.`

  // Assemble full prompt — every compositional attribute from the reference is included
  const sections = [
    subjectLine,
    clothing,
    accessories,
    makeup,
    expressionDesc,
    poseDesc,
    cameraDesc,
    lightingDesc,
    settingDesc,
    styleDesc,
    sceneInstruction,
    'Photorealistic, high resolution, 8K, sharp focus.',
  ].filter(Boolean)

  return sections.join(' ')
}
