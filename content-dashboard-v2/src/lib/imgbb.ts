// ImgBB image hosting utility
// Uploads a local file or base64 image to ImgBB and returns a public URL
// Used to host reference images for Seedance I2V (ByteDance API requires public URLs)

const IMGBB_API_KEY = process.env.IMGBB_API_KEY

export class ImgBBError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImgBBError'
  }
}

/**
 * Upload an image to ImgBB from a local file path or URL.
 * Returns the permanent direct image URL.
 */
export async function uploadToImgBB(input: string): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new ImgBBError('IMGBB_API_KEY is not set in environment variables')
  }

  const formData = new FormData()
  formData.append('key', IMGBB_API_KEY)

  // Determine input type: local path, data URL, or remote URL
  if (input.startsWith('http://') || input.startsWith('https://')) {
    // Remote URL — check if it's already a public URL (not localhost)
    if (!input.includes('localhost') && !input.includes('127.0.0.1')) {
      // Already a public URL, no need to re-upload
      return input
    }
    // Localhost URL — fetch and upload as base64
    const response = await fetch(input)
    if (!response.ok) {
      throw new ImgBBError(`Failed to fetch local image: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    formData.append('image', base64)
  } else if (input.startsWith('data:')) {
    // Data URL — extract base64 part
    const base64 = input.split(',')[1]
    if (!base64) throw new ImgBBError('Invalid data URL')
    formData.append('image', base64)
  } else if (input.startsWith('/')) {
    // Local file path
    const { readFile } = await import('fs/promises')
    const buffer = await readFile(input)
    const base64 = buffer.toString('base64')
    formData.append('image', base64)
  } else {
    // Assume it's already base64
    formData.append('image', input)
  }

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new ImgBBError(`ImgBB API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new ImgBBError(`ImgBB upload failed: ${data.error?.message || 'Unknown error'}`)
  }

  // Return the direct image URL (permanent, no expiry)
  return data.data.url as string
}
