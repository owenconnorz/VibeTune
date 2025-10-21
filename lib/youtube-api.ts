export interface YouTubeVideo {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  channelTitle: string
  channelId?: string
  audioUrl?: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  continuation?: string
}

export interface HomeFeedSection {
  title: string
  items: YouTubeVideo[]
}

export interface HomeFeedResult {
  sections: HomeFeedSection[]
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || ""
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

function isQuotaExceeded(error: any): boolean {
  return error?.message?.includes("quotaExceeded") || error?.status === 403
}

export async function getTrendingMusic(): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&maxResults=20&regionCode=US&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      const error = await response.json()
      if (isQuotaExceeded(error)) {
        console.log("[v0] YouTube API quota exceeded")
        return []
      }
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      duration: formatDuration(item.contentDetails.duration),
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
    }))
  } catch (error) {
    console.error("[v0] Error fetching trending music:", error)
    return []
  }
}

export async function searchMusic(query: string): Promise<YouTubeSearchResult> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=20&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 300 } }, // Cache for 5 minutes
    )

    if (!response.ok) {
      const error = await response.json()
      if (isQuotaExceeded(error)) {
        console.log("[v0] YouTube API quota exceeded")
        return { videos: [] }
      }
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      duration: "0:00", // Duration not available in search results
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
    }))

    return { videos }
  } catch (error) {
    console.error("[v0] Error searching music:", error)
    return { videos: [] }
  }
}

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      return null
    }

    const item = data.items[0]
    return {
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      duration: formatDuration(item.contentDetails.duration),
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
    }
  } catch (error) {
    console.error("[v0] Error getting video details:", error)
    return null
  }
}

export async function getHomeFeed(): Promise<HomeFeedResult> {
  try {
    console.log("[v0] Fetching home feed from YouTube Data API...")

    // Get trending music
    const trending = await getTrendingMusic()

    if (trending.length === 0) {
      console.log("[v0] No trending music found (likely quota exceeded)")
      return { sections: [] }
    }

    // Create sections
    const sections: HomeFeedSection[] = [
      {
        title: "Trending Now",
        items: trending.slice(0, 10),
      },
      {
        title: "Popular Music",
        items: trending.slice(10, 20),
      },
    ]

    console.log("[v0] Successfully fetched home feed with", sections.length, "sections")
    return { sections }
  } catch (error) {
    console.error("[v0] Error getting home feed:", error)
    return { sections: [] }
  }
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return "0:00"

  const hours = match[1] ? Number.parseInt(match[1]) : 0
  const minutes = match[2] ? Number.parseInt(match[2]) : 0
  const seconds = match[3] ? Number.parseInt(match[3]) : 0

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
