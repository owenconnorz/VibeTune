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
  private pendingRequests = new Map<string, Promise<any>>()
  private quotaExceeded = false
  private lastQuotaCheck = 0
  private requestCount = 0
  private readonly CACHE_TTL = 8 * 60 * 60 * 1000 // 8 hours (was 4 hours)
  private readonly QUOTA_RESET_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours (was 1 hour)
  private readonly MAX_REQUESTS_PER_HOUR = 5 // Reduced from 15

  constructor(apiKey: string) {
    this.apiKey = apiKey
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("youtube_api_quota")
      if (stored) {
        try {
          const data = JSON.parse(stored)
          this.requestCount = data.requestCount || 0
          this.lastQuotaCheck = data.lastQuotaCheck || 0
          this.quotaExceeded = data.quotaExceeded || false
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }

  private getCacheKey(endpoint: string, params: Record<string, string>): string {
    const normalizedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          let value = params[key].toLowerCase().trim().replace(/\s+/g, " ")
          if (key === "q") {
            value = value.replace(/\b(music|song|audio|track)\b/g, "").trim()
          }
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )
    return `${endpoint}_${JSON.stringify(normalizedParams)}`
  }

  private getFromCache(key: string): YouTubeSearchResponse | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    console.log("[v0] YouTube API: Using cached data for", key.substring(0, 50) + "...")
    return entry.data
  }

  private setCache(key: string, data: YouTubeSearchResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL,
    })
    if (this.cache.size > 200) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }

  private checkQuotaStatus(): boolean {
    const now = Date.now()

    if (now - this.lastQuotaCheck > this.QUOTA_RESET_INTERVAL) {
      this.quotaExceeded = false
      this.requestCount = 0
      this.lastQuotaCheck = now
      console.log("[v0] YouTube API: Quota status reset")
      this.persistQuotaStatus()
    }

    if (this.requestCount >= this.MAX_REQUESTS_PER_HOUR) {
      this.quotaExceeded = true
      console.log("[v0] YouTube API: Self-imposed quota limit reached")
      this.persistQuotaStatus()
    }

    return !this.quotaExceeded
  }

  private persistQuotaStatus(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "youtube_api_quota",
          JSON.stringify({
            requestCount: this.requestCount,
            lastQuotaCheck: this.lastQuotaCheck,
            quotaExceeded: this.quotaExceeded,
          }),
        )
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  private async executeRequest(url: string, endpoint: string, cacheKey: string) {
    console.log("[v0] YouTube API request:", endpoint, "- Request count:", this.requestCount + 1)
    this.requestCount++
    this.persistQuotaStatus()

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "VibeTune-Music-App/1.0",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] YouTube API error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200) + "...",
        })

        if (response.status === 403 && errorText.includes("quota")) {
          this.quotaExceeded = true
          this.persistQuotaStatus()
          console.log("[v0] YouTube API: Quota exceeded, returning fallback data")
          return this.createFallbackResponse(endpoint)
        }

        console.log("[v0] YouTube API: API error, returning fallback data")
        return this.createFallbackResponse(endpoint)
      }

      const data = await response.json()
      console.log("[v0] YouTube API response success:", {
        endpoint,
        itemCount: data.items?.length || 0,
        cached: false,
      })

      return data
    } catch (error) {
      console.error("[v0] YouTube API request failed:", {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log("[v0] YouTube API: Request failed, returning fallback data")
      return this.createFallbackResponse(endpoint)
    }
  }

  private createFallbackResponse(endpoint: string) {
    const fallbackVideos = [...FALLBACK_MUSIC_DATA].sort(() => Math.random() - 0.5).slice(0, 8)

    if (endpoint === "search") {
      return {
        items: fallbackVideos.map((v) => ({
          id: { videoId: v.id },
          snippet: {
            title: v.title,
            channelTitle: v.artist,
            thumbnails: { high: { url: v.thumbnail } },
          },
          contentDetails: { duration: `PT${v.duration.replace(":", "M")}S` },
        })),
      }
    } else if (endpoint === "videos") {
      return {
        items: fallbackVideos.map((v) => ({
          id: v.id,
          snippet: {
            title: v.title,
            channelTitle: v.artist,
            thumbnails: { high: { url: v.thumbnail } },
          },
          contentDetails: { duration: `PT${v.duration.replace(":", "M")}S` },
          statistics: { viewCount: "1000000" },
        })),
      }
    }

    return { items: [] }
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

    if (this.pendingRequests.has(cacheKey)) {
      console.log("[v0] YouTube API: Deduplicating request for:", cacheKey.substring(0, 50) + "...")
      try {
        return await Promise.race([
          this.pendingRequests.get(cacheKey)!,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 15000)),
        ])
      } catch (error) {
        this.pendingRequests.delete(cacheKey)
        console.log("[v0] YouTube API: Deduplication failed, returning fallback data")
        return this.createFallbackResponse(endpoint)
      }
    }

    if (!this.checkQuotaStatus()) {
      console.log("[v0] YouTube API: Quota check failed, returning fallback data")
      return this.createFallbackResponse(endpoint)
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`)
    url.searchParams.append("key", this.apiKey)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const requestPromise = this.executeRequest(url.toString(), endpoint, cacheKey)
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  async search(query: string, maxResults = 25): Promise<YouTubeSearchResponse> {
    try {
      if (!this.checkQuotaStatus()) {
        console.log("[v0] YouTube API: Quota exceeded, using fallback data immediately")
        return this.generateFallbackData(query)
      }

      const normalizedQuery = query
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\b(music|song|audio|track|playlist|mix)\b/g, "")
        .trim()

      console.log("[v0] YouTube API search starting:", {
        originalQuery: query,
        normalizedQuery,
        maxResults,
      })

      const cacheKey = this.getCacheKey("search", {
        query: normalizedQuery,
        maxResults: maxResults.toString(),
      })

      const cached = this.getFromCache(cacheKey)
      if (cached) {
        console.log("[v0] YouTube API search results:", cached.videos.length, "songs (cached)")
        return cached
      }

      const searchResponse = await this.makeRequest("search", {
        part: "snippet",
        q: `${normalizedQuery} music`,
        type: "video",
        maxResults: maxResults.toString(),
        order: "relevance",
        videoCategoryId: "10", // Music category
      })

      if (!searchResponse.items?.length) {
        console.log("[v0] YouTube API search: No items found")
        const emptyResult = { videos: [] }
        this.setCache(cacheKey, emptyResult)
        return emptyResult
      }

      const uniqueVideoIds = [...new Set(searchResponse.items.map((item: any) => item.id.videoId))]
      const videoIds = uniqueVideoIds.join(",")

      const detailsResponse = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoIds,
      })

      const videos = detailsResponse.items.map((item: any) => this.parseVideo(item))
      console.log("[v0] YouTube API search results:", videos.length, "songs")

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

      console.log("[v0] YouTube API: Using fallback data due to error")
      return this.generateFallbackData(query)
    }
  }

  async getTrending(maxResults = 25): Promise<YouTubeSearchResponse> {
    try {
      if (!this.checkQuotaStatus()) {
        console.log("[v0] YouTube API: Quota exceeded, using fallback data for trending")
        return this.generateFallbackData()
      }

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

      console.log("[v0] YouTube API: Using fallback data for trending due to error")
      return this.generateFallbackData()
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

  private generateFallbackData(query?: string): YouTubeSearchResponse {
    console.log("[v0] YouTube API: Using fallback data due to quota limits")

    const shuffled = [...FALLBACK_MUSIC_DATA].sort(() => Math.random() - 0.5)
    const subset = shuffled.slice(0, Math.min(8, shuffled.length))

    return { videos: subset }
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
