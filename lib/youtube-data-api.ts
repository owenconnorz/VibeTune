export interface YouTubeVideo {
  id: string
  title: string
  artist: string
  duration: string
  thumbnail: string
  url: string
  views?: string
  publishedAt?: string
}

export interface YouTubeSearchResponse {
  videos: YouTubeVideo[]
  totalResults: number
  nextPageToken?: string
}

export class YouTubeDataAPI {
  private apiKey: string
  private baseUrl = "https://www.googleapis.com/youtube/v3"
  private quotaExceeded = false
  private lastQuotaReset = Date.now()

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("YouTube API key is required")
    }
    this.apiKey = apiKey
  }

  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<any> {
    // Check if quota was exceeded recently (reset after 24 hours)
    if (this.quotaExceeded && Date.now() - this.lastQuotaReset < 24 * 60 * 60 * 1000) {
      throw new Error("YouTube API quota exceeded")
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`)
    url.searchParams.append("key", this.apiKey)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    console.log("[v0] YouTube API request:", url.toString())

    try {
      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403 && data.error?.errors?.[0]?.reason === "quotaExceeded") {
          this.quotaExceeded = true
          this.lastQuotaReset = Date.now()
          console.log("[v0] YouTube API quota exceeded")
        }
        throw new Error(`YouTube API error: ${data.error?.message || response.statusText}`)
      }

      // Reset quota exceeded flag on successful request
      if (this.quotaExceeded) {
        this.quotaExceeded = false
        console.log("[v0] YouTube API quota reset detected")
      }

      return data
    } catch (error) {
      console.error("[v0] YouTube API request failed:", error)
      throw error
    }
  }

  private parseVideo(item: any): YouTubeVideo {
    const videoId = item.id?.videoId || item.id
    const snippet = item.snippet || {}

    // Extract artist and title from video title
    const fullTitle = snippet.title || "Unknown Title"
    const channelTitle = snippet.channelTitle || "Unknown Artist"

    // Try to parse "Artist - Song" format
    let artist = channelTitle
    let title = fullTitle

    if (fullTitle.includes(" - ")) {
      const parts = fullTitle.split(" - ")
      if (parts.length >= 2) {
        artist = parts[0].trim()
        title = parts.slice(1).join(" - ").trim()
      }
    }

    // Clean up common suffixes
    title = title.replace(/\s*$$Official.*?$$$/i, "")
    title = title.replace(/\s*\[Official.*?\]$/i, "")
    title = title.replace(/\s*- Official.*$/i, "")

    return {
      id: videoId,
      title,
      artist,
      duration: this.parseDuration(item.contentDetails?.duration || "PT3M30S"),
      thumbnail:
        snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "/placeholder.svg?height=180&width=320",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      views: item.statistics?.viewCount,
      publishedAt: snippet.publishedAt,
    }
  }

  private parseDuration(duration: string): string {
    // Parse ISO 8601 duration format (PT3M30S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return "3:30"

    const hours = Number.parseInt(match[1] || "0")
    const minutes = Number.parseInt(match[2] || "0")
    const seconds = Number.parseInt(match[3] || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  async search(query: string, maxResults = 20): Promise<YouTubeSearchResponse> {
    try {
      // First, search for videos
      const searchData = await this.makeRequest("search", {
        part: "snippet",
        q: query + " music",
        type: "video",
        maxResults: maxResults.toString(),
        order: "relevance",
        videoCategoryId: "10", // Music category
        videoDefinition: "any",
        videoEmbeddable: "true",
      })

      if (!searchData.items || searchData.items.length === 0) {
        return { videos: [], totalResults: 0 }
      }

      // Get video IDs for additional details
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",")

      // Get video details including duration and statistics
      const detailsData = await this.makeRequest("videos", {
        part: "contentDetails,statistics",
        id: videoIds,
      })

      // Combine search results with details
      const videos = searchData.items.map((searchItem: any) => {
        const details = detailsData.items?.find((detail: any) => detail.id === searchItem.id.videoId)
        return this.parseVideo({
          ...searchItem,
          contentDetails: details?.contentDetails,
          statistics: details?.statistics,
        })
      })

      return {
        videos,
        totalResults: searchData.pageInfo?.totalResults || videos.length,
        nextPageToken: searchData.nextPageToken,
      }
    } catch (error) {
      console.error("[v0] YouTube search failed:", error)
      throw error
    }
  }

  async getTrending(maxResults = 20): Promise<YouTubeSearchResponse> {
    try {
      // Get trending music videos
      const data = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        chart: "mostPopular",
        videoCategoryId: "10", // Music category
        maxResults: maxResults.toString(),
        regionCode: "US",
      })

      if (!data.items || data.items.length === 0) {
        return { videos: [], totalResults: 0 }
      }

      const videos = data.items.map((item: any) => this.parseVideo(item))

      return {
        videos,
        totalResults: data.pageInfo?.totalResults || videos.length,
      }
    } catch (error) {
      console.error("[v0] YouTube trending failed:", error)
      throw error
    }
  }

  async getPlaylist(playlistId: string, maxResults = 50): Promise<YouTubeSearchResponse> {
    try {
      const data = await this.makeRequest("playlistItems", {
        part: "snippet",
        playlistId,
        maxResults: maxResults.toString(),
      })

      if (!data.items || data.items.length === 0) {
        return { videos: [], totalResults: 0 }
      }

      // Get video IDs for additional details
      const videoIds = data.items.map((item: any) => item.snippet.resourceId.videoId).join(",")

      // Get video details
      const detailsData = await this.makeRequest("videos", {
        part: "contentDetails,statistics",
        id: videoIds,
      })

      // Combine playlist items with details
      const videos = data.items.map((playlistItem: any) => {
        const videoId = playlistItem.snippet.resourceId.videoId
        const details = detailsData.items?.find((detail: any) => detail.id === videoId)

        return this.parseVideo({
          id: { videoId },
          snippet: playlistItem.snippet,
          contentDetails: details?.contentDetails,
          statistics: details?.statistics,
        })
      })

      return {
        videos,
        totalResults: data.pageInfo?.totalResults || videos.length,
        nextPageToken: data.nextPageToken,
      }
    } catch (error) {
      console.error("[v0] YouTube playlist failed:", error)
      throw error
    }
  }
}

// Factory function to create YouTube API instance
export function createYouTubeAPI(): YouTubeDataAPI {
  const apiKey = process.env.YOUTUBE_API_KEY || "AIzaSyBIQVGnXO2T7smsxf6q_MWxMD1sQzek1Nc"
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is required")
  }
  return new YouTubeDataAPI(apiKey)
}

export function createYouTubeDataAPI(): YouTubeDataAPI {
  return createYouTubeAPI()
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  duration: string
  thumbnail: string
  url: string
  source: string
}

export interface MusicSearchResult {
  tracks: MusicTrack[]
  totalResults: number
}

export class MusicAPIWrapper {
  private youtubeAPI: YouTubeDataAPI

  constructor(youtubeAPI: YouTubeDataAPI) {
    this.youtubeAPI = youtubeAPI
  }

  async search(query: string, maxResults = 20): Promise<MusicSearchResult> {
    try {
      const result = await this.youtubeAPI.search(query, maxResults)
      return {
        tracks: result.videos.map((video) => ({
          ...video,
          source: "youtube",
        })),
        totalResults: result.totalResults,
      }
    } catch (error) {
      console.error("[v0] YouTube API search failed, using fallback:", error)
      return {
        tracks: fallbackMusicData.slice(0, maxResults).map((video) => ({
          ...video,
          source: "fallback",
        })),
        totalResults: fallbackMusicData.length,
      }
    }
  }

  async getTrending(maxResults = 20): Promise<MusicSearchResult> {
    try {
      const result = await this.youtubeAPI.getTrending(maxResults)
      return {
        tracks: result.videos.map((video) => ({
          ...video,
          source: "youtube",
        })),
        totalResults: result.totalResults,
      }
    } catch (error) {
      console.error("[v0] YouTube API trending failed, using fallback:", error)
      return {
        tracks: fallbackMusicData.slice(0, maxResults).map((video) => ({
          ...video,
          source: "fallback",
        })),
        totalResults: fallbackMusicData.length,
      }
    }
  }
}

// Fallback data for when API fails
export const fallbackMusicData: YouTubeVideo[] = [
  {
    id: "fallback-1",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: "3:53",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
  },
  {
    id: "fallback-2",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
    thumbnail: "/weeknd-blinding-lights.png",
    url: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
  },
  {
    id: "fallback-3",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    duration: "3:20",
    thumbnail: "/taylor-swift-anti-hero.png",
    url: "https://www.youtube.com/watch?v=b1kbLWvqugk",
  },
  {
    id: "fallback-4",
    title: "As It Was",
    artist: "Harry Styles",
    duration: "2:47",
    thumbnail: "/harry-styles-as-it-was.png",
    url: "https://www.youtube.com/watch?v=H5v3kku4y6Q",
  },
  {
    id: "fallback-5",
    title: "Bad Habit",
    artist: "Steve Lacy",
    duration: "3:51",
    thumbnail: "/steve-lacy-bad-habit.png",
    url: "https://www.youtube.com/watch?v=VF-r5TtlT9w",
  },
]

export function createMusicAPI(): MusicAPIWrapper {
  const youtubeAPI = createYouTubeDataAPI()
  return new MusicAPIWrapper(youtubeAPI)
}
