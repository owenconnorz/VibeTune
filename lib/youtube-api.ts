// YouTube API utility functions for fetching music data using YouTube Data API v3

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class APICache {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 30 * 60 * 1000 // 30 minutes

  set(key: string, data: any, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear() {
    this.cache.clear()
  }
}

class QuotaManager {
  private isInBackoff = false
  private backoffUntil = 0
  private readonly BACKOFF_DURATION = 60 * 1000 // 1 minute

  isQuotaExceeded(): boolean {
    if (this.isInBackoff && Date.now() < this.backoffUntil) {
      const remainingTime = Math.ceil((this.backoffUntil - Date.now()) / 1000)
      console.log(`[v0] YouTube API in backoff, ${remainingTime}s remaining`)
      return true
    }

    if (this.isInBackoff && Date.now() >= this.backoffUntil) {
      this.isInBackoff = false
      console.log(`[v0] YouTube API backoff period ended`)
    }

    return false
  }

  setQuotaExceeded() {
    this.isInBackoff = true
    this.backoffUntil = Date.now() + this.BACKOFF_DURATION
    console.log(`[v0] YouTube API quota exceeded, backing off for ${this.BACKOFF_DURATION / 1000}s`)
  }
}

// Global instances
const apiCache = new APICache()
const quotaManager = new QuotaManager()

export interface YouTubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: string
  viewCount: string
  publishedAt: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  nextPageToken?: string
}

export interface YouTubePlaylist {
  id: string
  title: string
  description: string
  thumbnail: string
  videoCount: number
  privacy: string
  publishedAt: string
}

export class YouTubeAPI {
  private baseUrl = "https://www.googleapis.com/youtube/v3"
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || "AIzaSyBIQVGnXO2T7smsxf6q_MWxMD1sQzek1Nc"
  }

  async searchMusic(query: string, maxResults = 20): Promise<YouTubeSearchResult> {
    const cacheKey = `search:${query}:${maxResults}`

    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`[v0] Using cached search results for: ${query}`)
      return cached
    }

    // Check quota status
    if (quotaManager.isQuotaExceeded()) {
      throw new Error("YouTube API quota exceeded")
    }

    try {
      console.log(`[v0] Using YouTube Data API v3 to search for: ${query}`)

      const musicQuery = `${query} music OR song OR audio OR track OR official`
      const url = new URL(`${this.baseUrl}/search`)
      url.searchParams.set("part", "snippet")
      url.searchParams.set("q", musicQuery)
      url.searchParams.set("type", "video")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("order", "relevance")
      url.searchParams.set("videoCategoryId", "10") // Music category
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        if (response.status === 403) {
          quotaManager.setQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const videos = this.parseSearchResults(data.items || [])
      const result = {
        videos: this.filterMusicContent(videos),
        nextPageToken: data.nextPageToken,
      }

      // Cache successful results
      apiCache.set(cacheKey, result, 30 * 60 * 1000) // 30 minutes
      console.log(`[v0] YouTube Data API search returned ${result.videos.length} results for: ${query}`)
      return result
    } catch (error) {
      console.error("Error searching YouTube:", error)
      throw error
    }
  }

  async getTrendingMusic(maxResults = 20): Promise<YouTubeVideo[]> {
    const cacheKey = `trending:${maxResults}`

    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`[v0] Using cached trending music results`)
      return cached
    }

    // Check quota status
    if (quotaManager.isQuotaExceeded()) {
      throw new Error("YouTube API quota exceeded")
    }

    try {
      console.log(`[v0] Using YouTube Data API v3 to fetch trending music`)

      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set("part", "snippet,statistics,contentDetails")
      url.searchParams.set("chart", "mostPopular")
      url.searchParams.set("videoCategoryId", "10") // Music category
      url.searchParams.set("regionCode", "US")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        if (response.status === 403) {
          quotaManager.setQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const videos = this.parseTrendingResults(data.items || [])

      // Cache successful results for longer since trending changes less frequently
      apiCache.set(cacheKey, videos, 60 * 60 * 1000) // 1 hour
      console.log(`[v0] YouTube Data API trending returned ${videos.length} results`)
      return videos
    } catch (error) {
      console.error("Error fetching trending music:", error)
      throw error
    }
  }

  async getPlaylistVideos(playlistId: string, maxResults = 50): Promise<YouTubeVideo[]> {
    const cacheKey = `playlist:${playlistId}:${maxResults}`

    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`[v0] Using cached playlist results for: ${playlistId}`)
      return cached
    }

    if (quotaManager.isQuotaExceeded()) {
      throw new Error("YouTube API quota exceeded")
    }

    try {
      const url = new URL(`${this.baseUrl}/playlistItems`)
      url.searchParams.set("part", "snippet")
      url.searchParams.set("playlistId", playlistId)
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        if (response.status === 403) {
          quotaManager.setQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const videos = this.parsePlaylistResults(data.items || [])

      apiCache.set(cacheKey, videos)
      return videos
    } catch (error) {
      console.error("Error fetching playlist:", error)
      throw error
    }
  }

  async getUserPlaylists(accessToken: string, maxResults = 25): Promise<YouTubePlaylist[]> {
    if (quotaManager.isQuotaExceeded()) {
      throw new Error("YouTube API quota exceeded")
    }

    try {
      const url = new URL(`${this.baseUrl}/playlists`)
      url.searchParams.set("part", "snippet,contentDetails")
      url.searchParams.set("mine", "true")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          quotaManager.setQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.parsePlaylistsResults(data.items || [])
    } catch (error) {
      console.error("Error fetching user playlists:", error)
      throw error
    }
  }

  async getLikedVideos(accessToken: string, maxResults = 50): Promise<YouTubeVideo[]> {
    if (quotaManager.isQuotaExceeded()) {
      throw new Error("YouTube API quota exceeded")
    }

    try {
      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set("part", "snippet,statistics,contentDetails")
      url.searchParams.set("myRating", "like")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          quotaManager.setQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.parseTrendingResults(data.items || [])
    } catch (error) {
      console.error("Error fetching liked videos:", error)
      throw error
    }
  }

  private parseSearchResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.id?.videoId || item.id,
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      duration: this.parseDuration(item.contentDetails?.duration || "PT3M30S"),
      viewCount: item.statistics?.viewCount || "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parseTrendingResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.id,
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      duration: this.parseDuration(item.contentDetails?.duration || "PT3M30S"),
      viewCount: item.statistics?.viewCount || "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parsePlaylistResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.snippet?.resourceId?.videoId || "",
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "Unknown Channel",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      duration: "3:30", // Duration not available in playlist items, would need separate API call
      viewCount: "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parsePlaylistsResults(items: any[]): YouTubePlaylist[] {
    return items.map((item) => ({
      id: item.id,
      title: item.snippet?.title || "Unknown Playlist",
      description: item.snippet?.description || "",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      videoCount: item.contentDetails?.itemCount || 0,
      privacy: item.status?.privacyStatus || "private",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parseDuration(duration: string): string {
    if (!duration || !duration.startsWith("PT")) return "3:30"

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return "3:30"

    const hours = Number.parseInt(match[1] || "0")
    const minutes = Number.parseInt(match[2] || "0")
    const seconds = Number.parseInt(match[3] || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
  }

  private filterMusicContent(videos: YouTubeVideo[]): YouTubeVideo[] {
    const musicKeywords = [
      "official",
      "music",
      "song",
      "audio",
      "track",
      "album",
      "single",
      "remix",
      "cover",
      "acoustic",
      "live",
      "performance",
      "concert",
      "studio",
      "version",
      "ft.",
      "feat.",
    ]

    const nonMusicKeywords = [
      "tutorial",
      "how to",
      "review",
      "reaction",
      "vlog",
      "interview",
      "behind the scenes",
      "making of",
      "documentary",
      "news",
      "talk show",
      "podcast",
      "gameplay",
      "unboxing",
    ]

    return videos
      .filter((video) => {
        const title = video.title.toLowerCase()
        const channelTitle = video.channelTitle.toLowerCase()

        const hasMusicKeywords = musicKeywords.some((keyword) => title.includes(keyword))
        const hasNonMusicKeywords = nonMusicKeywords.some((keyword) => title.includes(keyword))

        // Filter out obvious non-music content
        if (hasNonMusicKeywords && !hasMusicKeywords) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase()
        const bTitle = b.title.toLowerCase()
        const aChannel = a.channelTitle.toLowerCase()
        const bChannel = b.channelTitle.toLowerCase()

        // Prioritize official music content
        const aIsOfficial = aTitle.includes("official") || aChannel.includes("vevo") || aChannel.includes("records")
        const bIsOfficial = bTitle.includes("official") || bChannel.includes("vevo") || bChannel.includes("records")

        if (aIsOfficial && !bIsOfficial) return -1
        if (!aIsOfficial && bIsOfficial) return 1

        return 0
      })
  }
}

// Create a singleton instance
export const createYouTubeAPI = (apiKey?: string) => new YouTubeAPI(apiKey)

export const clearYouTubeCache = () => {
  apiCache.clear()
  console.log("[v0] YouTube Data API cache cleared")
}
