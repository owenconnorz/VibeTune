// YouTube API utility functions for fetching music data

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3"

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

// Global cache instance
const apiCache = new APICache()

class QuotaManager {
  private quotaExceeded = false
  private backoffUntil = 0
  private backoffDelay = 60000 // Start with 1 minute

  isQuotaExceeded(): boolean {
    const now = Date.now()

    if (this.quotaExceeded && now < this.backoffUntil) {
      const remainingTime = Math.ceil((this.backoffUntil - now) / 1000)
      console.log(`[v0] Quota still exceeded, ${remainingTime}s remaining in backoff`)
      return true
    }

    if (now >= this.backoffUntil && this.quotaExceeded) {
      console.log(`[v0] Backoff period ended, resetting quota status`)
      this.quotaExceeded = false
    }

    return false
  }

  markQuotaExceeded() {
    this.quotaExceeded = true
    this.backoffUntil = Date.now() + this.backoffDelay
    console.log(
      `[v0] YouTube quota exceeded, backing off for ${this.backoffDelay / 1000} seconds until ${new Date(this.backoffUntil).toISOString()}`,
    )
    this.backoffDelay = Math.min(this.backoffDelay * 2, 3600000) // Max 1 hour
  }

  getStatus() {
    return {
      quotaExceeded: this.quotaExceeded,
      backoffUntil: this.backoffUntil,
      remainingTime: this.quotaExceeded ? Math.max(0, this.backoffUntil - Date.now()) : 0,
    }
  }

  reset() {
    console.log(`[v0] Resetting quota manager`)
    this.quotaExceeded = false
    this.backoffUntil = 0
    this.backoffDelay = 60000
  }
}

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
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchMusic(query: string, maxResults = 20): Promise<YouTubeSearchResult> {
    const cacheKey = `search:${query}:${maxResults}`

    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`[v0] Using cached search results for: ${query}`)
      return cached
    }

    const quotaStatus = quotaManager.getStatus()
    console.log(`[v0] Quota status before search API call:`, quotaStatus)

    if (quotaManager.isQuotaExceeded()) {
      console.log(`[v0] YouTube quota exceeded, cannot search for: ${query}`)
      throw new Error("YouTube API quota exceeded")
    }

    console.log(`[v0] Proceeding with YouTube API search for: ${query}`)

    try {
      const musicQuery = `${query} music OR song OR audio OR track OR official`
      const searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&type=video&videoCategoryId=10&videoDefinition=any&videoDuration=medium&maxResults=${maxResults * 2}&q=${encodeURIComponent(musicQuery)}&key=${this.apiKey}`

      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()

      if (!searchResponse.ok) {
        if (searchData.error?.message?.includes("quota")) {
          console.log(`[v0] Quota exceeded error detected, marking quota as exceeded`)
          quotaManager.markQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${searchData.error?.message || "Unknown error"}`)
      }

      const filteredItems = this.filterMusicContent(searchData.items).slice(0, maxResults)

      // Get video details including duration and statistics
      const videoIds = filteredItems.map((item: any) => item.id.videoId).join(",")
      if (!videoIds) {
        const result = { videos: [] }
        apiCache.set(cacheKey, result, 5 * 60 * 1000) // Cache empty results for 5 minutes
        return result
      }

      const detailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=contentDetails,statistics&id=${videoIds}&key=${this.apiKey}`

      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()

      if (!detailsResponse.ok) {
        if (detailsData.error?.message?.includes("quota")) {
          console.log(`[v0] Quota exceeded error detected, marking quota as exceeded`)
          quotaManager.markQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${detailsData.error?.message || "Unknown error"}`)
      }

      const videos: YouTubeVideo[] = filteredItems.map((item: any, index: number) => {
        const details = detailsData.items[index]
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
          duration: this.formatDuration(details?.contentDetails?.duration || "PT0S"),
          viewCount: details?.statistics?.viewCount || "0",
          publishedAt: item.snippet.publishedAt,
        }
      })

      const result = {
        videos,
        nextPageToken: searchData.nextPageToken,
      }

      // Cache successful results
      apiCache.set(cacheKey, result)
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

    const quotaStatus = quotaManager.getStatus()
    console.log(`[v0] Quota status before trending API call:`, quotaStatus)

    if (quotaManager.isQuotaExceeded()) {
      console.log(`[v0] YouTube quota exceeded, cannot fetch trending music`)
      throw new Error("YouTube API quota exceeded")
    }

    console.log(`[v0] Proceeding with YouTube API trending music call`)

    try {
      const url = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&maxResults=${maxResults * 2}&regionCode=US&key=${this.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        if (data.error?.message?.includes("quota")) {
          console.log(`[v0] Quota exceeded error detected, marking quota as exceeded`)
          quotaManager.markQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${data.error?.message || "Unknown error"}`)
      }

      const filteredItems = this.filterMusicContent(data.items).slice(0, maxResults)

      const result = filteredItems.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
        duration: this.formatDuration(item.contentDetails.duration),
        viewCount: item.statistics.viewCount,
        publishedAt: item.snippet.publishedAt,
      }))

      // Cache successful results for longer since trending changes less frequently
      apiCache.set(cacheKey, result, 60 * 60 * 1000) // 1 hour
      return result
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
      console.log(`[v0] YouTube quota exceeded, cannot fetch playlist: ${playlistId}`)
      throw new Error("YouTube API quota exceeded")
    }

    try {
      const url = `${YOUTUBE_API_BASE_URL}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${this.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        if (data.error?.message?.includes("quota")) {
          quotaManager.markQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${data.error?.message || "Unknown error"}`)
      }

      // Get video details for duration and statistics
      const videoIds = data.items.map((item: any) => item.snippet.resourceId.videoId).join(",")
      const detailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=contentDetails,statistics&id=${videoIds}&key=${this.apiKey}`

      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()

      if (!detailsResponse.ok) {
        if (detailsData.error?.message?.includes("quota")) {
          quotaManager.markQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${detailsData.error?.message || "Unknown error"}`)
      }

      const result = data.items.map((item: any, index: number) => {
        const details = detailsData.items[index]
        return {
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
          duration: this.formatDuration(details?.contentDetails?.duration || "PT0S"),
          viewCount: details?.statistics?.viewCount || "0",
          publishedAt: item.snippet.publishedAt,
        }
      })

      apiCache.set(cacheKey, result)
      return result
    } catch (error) {
      console.error("Error fetching playlist videos:", error)
      throw error
    }
  }

  async getUserPlaylists(accessToken: string, maxResults = 25): Promise<YouTubePlaylist[]> {
    if (quotaManager.isQuotaExceeded()) {
      throw new Error("YouTube API quota exceeded")
    }

    try {
      const url = `${YOUTUBE_API_BASE_URL}/playlists?part=snippet,contentDetails&mine=true&maxResults=${maxResults}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.message?.includes("quota")) {
          quotaManager.markQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${data.error?.message || "Unknown error"}`)
      }

      return data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description || "",
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
        videoCount: item.contentDetails.itemCount,
        privacy: item.status?.privacyStatus || "private",
        publishedAt: item.snippet.publishedAt,
      }))
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
      const url = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&myRating=like&maxResults=${maxResults}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.message?.includes("quota")) {
          quotaManager.markQuotaExceeded()
        }
        throw new Error(`YouTube API error: ${data.error?.message || "Unknown error"}`)
      }

      return data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
        duration: this.formatDuration(item.contentDetails.duration),
        viewCount: item.statistics.viewCount,
        publishedAt: item.snippet.publishedAt,
      }))
    } catch (error) {
      console.error("Error fetching liked videos:", error)
      throw error
    }
  }

  // Convert YouTube duration format (PT4M13S) to readable format (4:13)
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

  private filterMusicContent(items: any[]): any[] {
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

    const musicChannels = ["VEVO", "Records", "Music", "Entertainment", "Official", "Artist"]

    return items
      .filter((item: any) => {
        const title = item.snippet.title.toLowerCase()
        const channelTitle = item.snippet.channelTitle.toLowerCase()

        // Prioritize items with music keywords in title
        const hasMusicKeywords = musicKeywords.some((keyword) => title.includes(keyword))

        // Deprioritize items with non-music keywords
        const hasNonMusicKeywords = nonMusicKeywords.some((keyword) => title.includes(keyword))

        // Prioritize music-related channels
        const isMusicChannel = musicChannels.some((keyword) => channelTitle.includes(keyword.toLowerCase()))

        // Filter out obvious non-music content
        if (hasNonMusicKeywords && !hasMusicKeywords) {
          return false
        }

        return true
      })
      .sort((a: any, b: any) => {
        const aTitle = a.snippet.title.toLowerCase()
        const bTitle = b.snippet.title.toLowerCase()
        const aChannel = a.snippet.channelTitle.toLowerCase()
        const bChannel = b.snippet.channelTitle.toLowerCase()

        // Prioritize official music content
        const aIsOfficial = aTitle.includes("official") || aChannel.includes("vevo") || aChannel.includes("records")
        const bIsOfficial = bTitle.includes("official") || bChannel.includes("vevo") || bChannel.includes("records")

        if (aIsOfficial && !bIsOfficial) return -1
        if (!aIsOfficial && bIsOfficial) return 1

        // Prioritize music keywords
        const aMusicScore = musicKeywords.reduce((score, keyword) => score + (aTitle.includes(keyword) ? 1 : 0), 0)
        const bMusicScore = musicKeywords.reduce((score, keyword) => score + (bTitle.includes(keyword) ? 1 : 0), 0)

        return bMusicScore - aMusicScore
      })
  }
}

// Create a singleton instance
export const createYouTubeAPI = (apiKey: string) => new YouTubeAPI(apiKey)

export const clearYouTubeCache = () => {
  apiCache.clear()
  quotaManager.reset()
  console.log("[v0] YouTube API cache and quota manager cleared")
}
