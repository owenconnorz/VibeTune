// YouTube API utility functions for fetching music data using Innertube API

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
  private baseUrl = "https://www.youtube.com/youtubei/v1"
  private apiKey = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8" // Public Innertube API key
  private context = {
    client: {
      clientName: "WEB",
      clientVersion: "2.20240101.00.00",
      hl: "en",
      gl: "US",
      utcOffsetMinutes: 0,
    },
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Origin: "https://www.youtube.com",
      Referer: "https://www.youtube.com/",
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": "2.20240101.00.00",
    }
  }

  constructor(apiKey?: string) {
    // Innertube doesn't require user API key, uses public key
  }

  async searchMusic(query: string, maxResults = 20): Promise<YouTubeSearchResult> {
    const cacheKey = `innertube_search:${query}:${maxResults}`

    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`[v0] Using cached Innertube search results for: ${query}`)
      return cached
    }

    try {
      console.log(`[v0] Using Innertube API to search for: ${query}`)

      const musicQuery = `${query} music OR song OR audio OR track OR official`
      const response = await fetch(`${this.baseUrl}/search?key=${this.apiKey}`, {
        method: "POST",
        headers: this.getHeaders(), // Using production-ready headers
        body: JSON.stringify({
          context: this.context,
          query: musicQuery,
          params: "EgIQAQ%3D%3D", // Filter for videos only
        }),
      })

      if (!response.ok) {
        throw new Error(`Innertube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      const videos = this.parseSearchResults(data, maxResults)
      const result = {
        videos,
        nextPageToken:
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
            ?.musicShelfRenderer?.continuations?.[0]?.nextContinuationData?.continuation,
      }

      // Cache successful results
      apiCache.set(cacheKey, result, 30 * 60 * 1000) // 30 minutes
      console.log(`[v0] Innertube search returned ${videos.length} results for: ${query}`)
      return result
    } catch (error) {
      console.error("Error searching with Innertube:", error)
      throw error
    }
  }

  async getTrendingMusic(maxResults = 20): Promise<YouTubeVideo[]> {
    const cacheKey = `innertube_trending:${maxResults}`

    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`[v0] Using cached Innertube trending music results`)
      return cached
    }

    try {
      console.log(`[v0] Using Innertube API to fetch trending music`)

      const response = await fetch(`${this.baseUrl}/browse?key=${this.apiKey}`, {
        method: "POST",
        headers: this.getHeaders(), // Using production-ready headers
        body: JSON.stringify({
          context: this.context,
          browseId: "FEmusic_trending",
        }),
      })

      if (!response.ok) {
        throw new Error(`Innertube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const videos = this.parseTrendingResults(data, maxResults)

      // Cache successful results for longer since trending changes less frequently
      apiCache.set(cacheKey, videos, 60 * 60 * 1000) // 1 hour
      console.log(`[v0] Innertube trending returned ${videos.length} results`)
      return videos
    } catch (error) {
      console.error("Error fetching trending with Innertube:", error)
      throw error
    }
  }

  async getPlaylistVideos(playlistId: string, maxResults = 50): Promise<YouTubeVideo[]> {
    const cacheKey = `innertube_playlist:${playlistId}:${maxResults}`

    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`[v0] Using cached Innertube playlist results for: ${playlistId}`)
      return cached
    }

    try {
      const response = await fetch(`${this.baseUrl}/browse?key=${this.apiKey}`, {
        method: "POST",
        headers: this.getHeaders(), // Using production-ready headers
        body: JSON.stringify({
          context: this.context,
          browseId: `VL${playlistId}`,
        }),
      })

      if (!response.ok) {
        throw new Error(`Innertube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const videos = this.parsePlaylistResults(data, maxResults)

      apiCache.set(cacheKey, videos)
      return videos
    } catch (error) {
      console.error("Error fetching playlist with Innertube:", error)
      throw error
    }
  }

  async getUserPlaylists(accessToken: string, maxResults = 25): Promise<YouTubePlaylist[]> {
    // Note: Innertube doesn't support authenticated requests in the same way
    // This would require a different approach for user-specific data
    throw new Error("User playlists not supported with Innertube API")
  }

  async getLikedVideos(accessToken: string, maxResults = 50): Promise<YouTubeVideo[]> {
    // Note: Innertube doesn't support authenticated requests in the same way
    // This would require a different approach for user-specific data
    throw new Error("Liked videos not supported with Innertube API")
  }

  private parseSearchResults(data: any, maxResults: number): YouTubeVideo[] {
    try {
      const contents =
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || []
      const videos: YouTubeVideo[] = []

      for (const section of contents) {
        const items = section.videoRenderer ? [section] : section.itemSectionRenderer?.contents || []

        for (const item of items) {
          if (item.videoRenderer && videos.length < maxResults) {
            const video = item.videoRenderer
            videos.push({
              id: video.videoId,
              title: video.title?.runs?.[0]?.text || video.title?.simpleText || "Unknown Title",
              channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown Channel",
              thumbnail: video.thumbnail?.thumbnails?.[0]?.url || "",
              duration: this.parseDuration(video.lengthText?.simpleText || "0:00"),
              viewCount: video.viewCountText?.simpleText?.replace(/[^\d]/g, "") || "0",
              publishedAt: video.publishedTimeText?.simpleText || new Date().toISOString(),
            })
          }
        }
      }

      return this.filterMusicContent(videos)
    } catch (error) {
      console.error("Error parsing Innertube search results:", error)
      return []
    }
  }

  private parseTrendingResults(data: any, maxResults: number): YouTubeVideo[] {
    try {
      const contents =
        data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
        []
      const videos: YouTubeVideo[] = []

      for (const section of contents) {
        const items = section.musicCarouselShelfRenderer?.contents || section.musicShelfRenderer?.contents || []

        for (const item of items) {
          if (item.musicTwoRowItemRenderer && videos.length < maxResults) {
            const video = item.musicTwoRowItemRenderer
            videos.push({
              id: video.navigationEndpoint?.watchEndpoint?.videoId || "",
              title: video.title?.runs?.[0]?.text || "Unknown Title",
              channelTitle: video.subtitle?.runs?.[0]?.text || "Unknown Channel",
              thumbnail: video.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url || "",
              duration: "3:30", // Innertube trending doesn't always provide duration
              viewCount: "0",
              publishedAt: new Date().toISOString(),
            })
          }
        }
      }

      return videos.filter((v) => v.id) // Filter out items without video IDs
    } catch (error) {
      console.error("Error parsing Innertube trending results:", error)
      return []
    }
  }

  private parsePlaylistResults(data: any, maxResults: number): YouTubeVideo[] {
    try {
      const contents =
        data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
        []
      const videos: YouTubeVideo[] = []

      for (const section of contents) {
        const items = section.musicPlaylistShelfRenderer?.contents || []

        for (const item of items) {
          if (item.musicResponsiveListItemRenderer && videos.length < maxResults) {
            const video = item.musicResponsiveListItemRenderer
            videos.push({
              id: video.playNavigationEndpoint?.watchEndpoint?.videoId || "",
              title:
                video.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ||
                "Unknown Title",
              channelTitle:
                video.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ||
                "Unknown Channel",
              thumbnail: video.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url || "",
              duration: video.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.simpleText || "3:30",
              viewCount: "0",
              publishedAt: new Date().toISOString(),
            })
          }
        }
      }

      return videos.filter((v) => v.id)
    } catch (error) {
      console.error("Error parsing Innertube playlist results:", error)
      return []
    }
  }

  private parseDuration(durationText: string): string {
    // Convert various duration formats to MM:SS
    if (!durationText) return "0:00"

    // If already in MM:SS or H:MM:SS format, return as is
    if (durationText.match(/^\d+:\d{2}(:\d{2})?$/)) {
      return durationText
    }

    // Handle other formats or default to 3:30
    return "3:30"
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
  console.log("[v0] Innertube API cache cleared")
}
