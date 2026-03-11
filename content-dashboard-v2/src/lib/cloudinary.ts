/**
 * Cloudinary video re-upload utility.
 * Re-uploads a video from a remote URL to Cloudinary for fast EU CDN delivery.
 */

export async function uploadVideoToCloudinary(videoUrl: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName) {
    // Graceful fallback: Cloudinary not configured
    return videoUrl
  }

  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!apiKey || !apiSecret) {
    console.warn('[Cloudinary] Missing API key or secret, skipping re-upload')
    return videoUrl
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'content-dashboard/videos'

  // Build signature: folder=...&timestamp=...&<api_secret>
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = await sha1(`${paramsToSign}${apiSecret}`)

  const formData = new FormData()
  formData.append('file', videoUrl)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', folder)
  formData.append('resource_type', 'video')

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Cloudinary upload failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as { secure_url: string }
  return data.secure_url
}

async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
