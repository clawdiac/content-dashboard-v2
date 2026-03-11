export function getVideoSrc(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('/')) return url
  if (url.startsWith('http')) return `/api/video-proxy?url=${encodeURIComponent(url)}`
  return url
}
