// Invidious API client for YouTube data without quota limits
// Uses public Invidious instances as a YouTube proxy

const INVIDIOUS_INSTANCES = ["https://yewtu.be", "https://inv.nadeko.net", "https://invidious.nerdvpn.de"]

// Try multiple instances in case one is down
async function fetchFromInvidious(path: string): Promise<any> {
  let lastError: Error | null = null

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}${path}`
      console.log(`[v0] Trying Invidious instance: ${url}`)

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`[v0] Successfully fetched from ${instance}`)
      return data
    } catch (error) {
      console.error(`[v0] Failed to fetch from ${instance}:`, error)
      lastError = error as Error
      continue
    }
  }

  throw new Error(`All Invidious instances failed. Last error: ${lastError?.message}`)
}

export interface InvidiousVideo {
  videoId: string
  title: string
  author: string
  authorId: string
  videoThumbnails: Array<{
    quality: string
    url: string
    width: number
    height: number
  }>
  lengthSeconds: number
  viewCount: number
  published: number
  publishedText: string
}

export async function searchMusic(query: string, page = 1): Promise<{ videos: InvidiousVideo[]; hasMore: boolean }> {
  try {
    const encodedQuery = encodeURIComponent(query)
    // Use type=video and filter for music category
    const path = `/api/v1/search?q=${encodedQuery}&type=video&page=${page}`

    const results = await fetchFromInvidious(path)

    // Filter results to prefer music-related content
    const videos = Array.isArray(results) ? results : []

    return {
      videos: videos.slice(0, 20), // Limit to 20 results per page
      hasMore: videos.length >= 20,
    }
  } catch (error) {
    console.error("[v0] Invidious search error:", error)
    throw error
  }
}

export async function getVideoDetails(videoId: string): Promise<InvidiousVideo> {
  try {
    const path = `/api/v1/videos/${videoId}`
    const data = await fetchFromInvidious(path)
    return data
  } catch (error) {
    console.error("[v0] Invidious video details error:", error)
    throw error
  }
}

export async function getTrending(): Promise<InvidiousVideo[]> {
  try {
    // Get trending music videos
    const path = `/api/v1/trending?type=music`
    const data = await fetchFromInvidious(path)
    return Array.isArray(data) ? data.slice(0, 20) : []
  } catch (error) {
    console.error("[v0] Invidious trending error:", error)
    throw error
  }
}

export async function getPopular(): Promise<InvidiousVideo[]> {
  try {
    // Get popular videos (fallback if trending fails)
    const path = `/api/v1/popular`
    const data = await fetchFromInvidious(path)
    return Array.isArray(data) ? data.slice(0, 20) : []
  } catch (error) {
    console.error("[v0] Invidious popular error:", error)
    throw error
  }
}

// Convert Invidious video format to our app's format
export function convertToAppFormat(video: InvidiousVideo) {
  const thumbnail =
    video.videoThumbnails?.find((t) => t.quality === "medium" || t.quality === "high") || video.videoThumbnails?.[0]

  return {
    id: video.videoId,
    title: video.title,
    artist: video.author,
    thumbnail: thumbnail?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
    duration: video.lengthSeconds,
    views: video.viewCount,
    publishedAt: new Date(video.published * 1000).toISOString(),
  }
}
