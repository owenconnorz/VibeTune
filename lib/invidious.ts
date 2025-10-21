// Invidious API client for YouTube data without quota limits
// Uses public Invidious instances as a YouTube proxy

const INVIDIOUS_INSTANCES = ["https://yewtu.be", "https://inv.nadeko.net", "https://invidious.nerdvpn.de"]

let lastSuccessfulInstance = INVIDIOUS_INSTANCES[0]

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
      lastSuccessfulInstance = instance
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
    const musicQuery = query.toLowerCase().includes("music") ? query : `${query} music`
    const encodedMusicQuery = encodeURIComponent(musicQuery)
    const path = `/api/v1/search?q=${encodedMusicQuery}&type=video&page=${page}`

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

export async function getMusicByGenre(genre: string): Promise<InvidiousVideo[]> {
  try {
    // Search for music by genre
    const path = `/api/v1/search?q=${encodeURIComponent(genre + " music")}&type=video`
    const data = await fetchFromInvidious(path)
    return Array.isArray(data) ? data.slice(0, 10) : []
  } catch (error) {
    console.error(`[v0] Invidious ${genre} music error:`, error)
    throw error
  }
}

export async function getPopularMusic(): Promise<InvidiousVideo[]> {
  try {
    // Fetch popular music from different genres
    const genres = ["pop music hits", "rock music", "hip hop music", "electronic music"]
    const randomGenre = genres[Math.floor(Math.random() * genres.length)]

    const path = `/api/v1/search?q=${encodeURIComponent(randomGenre)}&type=video&sort_by=view_count`
    const data = await fetchFromInvidious(path)
    return Array.isArray(data) ? data.slice(0, 20) : []
  } catch (error) {
    console.error("[v0] Invidious popular music error:", error)
    throw error
  }
}

// Convert Invidious video format to our app's format
export function convertToAppFormat(video: InvidiousVideo) {
  const thumbnail =
    video.videoThumbnails?.find((t) => t.quality === "medium" || t.quality === "high") || video.videoThumbnails?.[0]

  let thumbnailUrl = thumbnail?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`

  // If the URL is relative (starts with /), prepend the Invidious instance
  if (thumbnailUrl.startsWith("/")) {
    thumbnailUrl = `${lastSuccessfulInstance}${thumbnailUrl}`
  }

  return {
    id: video.videoId,
    title: video.title,
    artist: video.author,
    thumbnail: thumbnailUrl,
    duration: video.lengthSeconds,
    views: video.viewCount,
    publishedAt: new Date(video.published * 1000).toISOString(),
  }
}
