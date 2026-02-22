import type { ModelConfig, KlingConfig } from './types'
import { MODEL_REGISTRY } from './registry'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateModelConfig(config: ModelConfig): ValidationResult {
  const errors: string[] = []
  const spec = MODEL_REGISTRY[config.model]

  if (!spec) {
    return { valid: false, errors: [`Unknown model: ${config.model}`] }
  }

  for (const param of spec.params) {
    const value = (config as any)[param.key]

    if (param.required && (value === null || value === undefined || value === '')) {
      errors.push(`${param.label} is required`)
      continue
    }

    if (value === null || value === undefined) continue

    if (param.type === 'select' && param.options) {
      const validValues = param.options.map(o => o.value)
      if (!validValues.includes(String(value))) {
        errors.push(`${param.label}: invalid value "${value}"`)
      }
    }

    if ((param.type === 'number' || param.type === 'slider') && typeof value === 'number') {
      if (param.min !== undefined && value < param.min) {
        errors.push(`${param.label}: minimum is ${param.min}`)
      }
      if (param.max !== undefined && value > param.max) {
        errors.push(`${param.label}: maximum is ${param.max}`)
      }
    }
  }

  if (config.model === 'kling') {
    const kc = config as KlingConfig
    if (kc.camera_control && kc.advanced_camera_control) {
      // advanced overrides preset — warn but don't error
    }
  }

  return { valid: errors.length === 0, errors }
}
