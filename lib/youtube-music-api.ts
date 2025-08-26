interface YouTubeVideo {
  id: string
  title: string
  artist: string
  duration: string
  thumbnail: string
  viewCount?: string
  publishedAt?: string
}

interface YouTubeSearchResponse {
  videos: YouTubeVideo[]
  nextPageToken?: string
}

interface CacheEntry {
  data: YouTubeSearchResponse
  timestamp: number
  ttl: number
}

// Fallback data for when API quota is exceeded
const FALLBACK_MUSIC_DATA: YouTubeVideo[] = [
  {
    id: "fallback_1",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: "3:53",
    thumbnail: "/ed-sheeran-shape-of-you.png",
  },
  {
    id: "fallback_2",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
    thumbnail: "/the-weeknd-blinding-lights.png",
  },
  {
    id: "fallback_3",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    duration: "2:54",
    thumbnail: "/harry-styles-watermelon-sugar.png",
  },
  {
    id: "fallback_4",
    title: "Levitating",
    artist: "Dua Lipa",
    duration: "3:23",
    thumbnail: "/dua-lipa-levitating.png",
  },
  {
    id: "fallback_5",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    duration: "2:58",
    thumbnail: "/olivia-rodrigo-good-4-u.png",
  },
  {
    id: "fallback_6",
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    duration: "2:21",
    thumbnail: "/the-kid-laroi-justin-bieber-stay.png",
  },
  {
    id: "fallback_7",
    title: "Heat Waves",
    artist: "Glass Animals",
    duration: "3:58",
    thumbnail: "/glass-animals-heat-waves.png",
  },
  {
    id: "fallback_8",
    title: "Industry Baby",
    artist: "Lil Nas X & Jack Harlow",
    duration: "3:32",
    thumbnail: "/lil-nas-x-jack-harlow-industry-baby.png",
  },
]

class YouTubeMusicAPI {
  private apiKey: string
  private baseUrl = "https://www.googleapis.com/youtube/v3"
  private cache = new Map<string, CacheEntry>()
  private quotaExceeded = false
  private lastQuotaCheck = 0
  private requestCount = 0
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly QUOTA_RESET_INTERVAL = 60 * 60 * 1000 // 1 hour
  private readonly MAX_REQUESTS_PER_HOUR = 50

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private getCacheKey(endpoint: string, params: Record<string, string>): string {
    return `${endpoint}_${JSON.stringify(params)}`
  }

  private getFromCache(key: string): YouTubeSearchResponse | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    console.log("[v0] YouTube API: Using cached data for", key)
    return entry.data
  }

  private setCache(key: string, data: YouTubeSearchResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL,
    })
  }

  private checkQuotaStatus(): boolean {
    const now = Date.now()

    // Reset quota status every hour
    if (now - this.lastQuotaCheck > this.QUOTA_RESET_INTERVAL) {
      this.quotaExceeded = false
      this.requestCount = 0
      this.lastQuotaCheck = now
    }

    // Check if we've exceeded our self-imposed limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_HOUR) {
      this.quotaExceeded = true
    }

    return !this.quotaExceeded
  }

  private generateFallbackData(query?: string): YouTubeSearchResponse {
    console.log("[v0] YouTube API: Using fallback data due to quota limits")

    // Shuffle and return a subset of fallback data
    const shuffled = [...FALLBACK_MUSIC_DATA].sort(() => Math.random() - 0.5)
    const subset = shuffled.slice(0, Math.min(8, shuffled.length))

    return { videos: subset }
  }

  private async makeRequest(endpoint: string, params: Record<string, string>) {
    const cacheKey = this.getCacheKey(endpoint, params)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        items: cached.videos.map((v) => ({
          id: { videoId: v.id },
          snippet: {
            title: v.title,
            channelTitle: v.artist,
            thumbnails: { high: { url: v.thumbnail } },
          },
          contentDetails: { duration: `PT${v.duration.replace(":", "M")}S` },
        })),
      }
    }

    if (!this.checkQuotaStatus()) {
      throw new Error("API quota exceeded - using fallback data")
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`)
    url.searchParams.append("key", this.apiKey)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    console.log("[v0] YouTube API request:", url.toString())
    this.requestCount++

    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] YouTube API error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })

        if (response.status === 403 && errorText.includes("quota")) {
          this.quotaExceeded = true
          throw new Error("API quota exceeded - using fallback data")
        }

        // Parse error details if available
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            throw new Error(`YouTube API error: ${errorData.error.message || response.statusText} (${response.status})`)
          }
        } catch (parseError) {
          // If JSON parsing fails, use the raw error text
          throw new Error(`YouTube API error: ${response.statusText} (${response.status}): ${errorText}`)
        }
      }

      const data = await response.json()
      console.log("[v0] YouTube API response success:", {
        endpoint,
        itemCount: data.items?.length || 0,
      })

      return data
    } catch (error) {
      console.error("[v0] YouTube API request failed:", {
        endpoint,
        params,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return "0:00"

    const hours = Number.parseInt(match[1]?.replace("H", "") || "0")
    const minutes = Number.parseInt(match[2]?.replace("M", "") || "0")
    const seconds = Number.parseInt(match[3]?.replace("S", "") || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  private parseVideo(item: any): YouTubeVideo {
    const snippet = item.snippet
    const contentDetails = item.contentDetails

    return {
      id: item.id.videoId || item.id,
      title: snippet.title,
      artist: snippet.channelTitle,
      duration: contentDetails ? this.formatDuration(contentDetails.duration) : "0:00",
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      viewCount: item.statistics?.viewCount,
      publishedAt: snippet.publishedAt,
    }
  }

  async search(query: string, maxResults = 25): Promise<YouTubeSearchResponse> {
    try {
      console.log("[v0] YouTube API search starting:", { query, maxResults })

      const cacheKey = this.getCacheKey("search", { query, maxResults: maxResults.toString() })
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      // Search for videos
      const searchResponse = await this.makeRequest("search", {
        part: "snippet",
        q: `${query} music`,
        type: "video",
        maxResults: maxResults.toString(),
        order: "relevance",
        videoCategoryId: "10", // Music category
      })

      if (!searchResponse.items?.length) {
        console.log("[v0] YouTube API search: No items found")
        return { videos: [] }
      }

      // Get video details including duration
      const videoIds = searchResponse.items.map((item: any) => item.id.videoId).join(",")
      console.log("[v0] YouTube API: Fetching details for video IDs:", videoIds)

      const detailsResponse = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoIds,
      })

      const videos = detailsResponse.items.map((item: any) => this.parseVideo(item))
      console.log("[v0] YouTube API search completed:", { resultCount: videos.length })

      const result = {
        videos,
        nextPageToken: searchResponse.nextPageToken,
      }

      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error("[v0] YouTube Music API search error:", {
        query,
        error: error instanceof Error ? error.message : String(error),
      })

      if (error instanceof Error && error.message.includes("quota exceeded")) {
        return this.generateFallbackData(query)
      }

      return { videos: [] }
    }
  }

  async getTrending(maxResults = 25): Promise<YouTubeSearchResponse> {
    try {
      console.log("[v0] YouTube API trending starting:", { maxResults })

      const cacheKey = this.getCacheKey("trending", { maxResults: maxResults.toString() })
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        chart: "mostPopular",
        videoCategoryId: "10", // Music category
        maxResults: maxResults.toString(),
        regionCode: "US",
      })

      if (!response.items?.length) {
        console.log("[v0] YouTube API trending: No items found")
        return { videos: [] }
      }

      const videos = response.items.map((item: any) => this.parseVideo(item))
      console.log("[v0] YouTube API trending completed:", { resultCount: videos.length })

      const result = { videos }

      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error("[v0] YouTube Music API trending error:", {
        error: error instanceof Error ? error.message : String(error),
      })

      if (error instanceof Error && error.message.includes("quota exceeded")) {
        return this.generateFallbackData()
      }

      return { videos: [] }
    }
  }

  async getVideoDetails(videoId: string) {
    try {
      const response = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoId,
      })

      if (!response.items?.length) {
        return null
      }

      return this.parseVideo(response.items[0])
    } catch (error) {
      console.error("YouTube Music API video details error:", {
        videoId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return null
    }
  }
}

export function createYouTubeMusicAPI() {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is required")
  }
  return new YouTubeMusicAPI(apiKey)
}

export type { YouTubeVideo, YouTubeSearchResponse }
