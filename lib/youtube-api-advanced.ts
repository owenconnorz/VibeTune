export interface YouTubeAPISettings {
  highQuality: boolean
  preferVideos: boolean
  showVideos: boolean
  highQualityAudio: boolean
  preferOpus: boolean
  adaptiveAudio: boolean
}

export interface YouTubeSearchResult {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
  publishedAt: string
  viewCount: number
  description: string
}

export class AdvancedYouTubeAPI {
  private apiKey: string
  private settings: YouTubeAPISettings

  constructor(apiKey: string, settings: YouTubeAPISettings) {
    this.apiKey = apiKey
    this.settings = settings
    console.log("[v0] Advanced YouTube API initialized with settings:", settings)
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return 0

    const hours = Number.parseInt(match[1]?.replace("H", "") || "0")
    const minutes = Number.parseInt(match[2]?.replace("M", "") || "0")
    const seconds = Number.parseInt(match[3]?.replace("S", "") || "0")

    return hours * 3600 + minutes * 60 + seconds
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  async search(query: string, type: "video" | "music" = "music"): Promise<YouTubeSearchResult[]> {
    try {
      console.log(`[v0] Searching YouTube for: "${query}"`)

      // Use YouTube Data API v3 search endpoint
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search")
      searchUrl.searchParams.set("part", "snippet")
      searchUrl.searchParams.set("type", "video")
      searchUrl.searchParams.set("q", query)
      searchUrl.searchParams.set("maxResults", "25")
      searchUrl.searchParams.set("key", this.apiKey)
      searchUrl.searchParams.set("videoCategoryId", "10") // Music category
      searchUrl.searchParams.set("order", "relevance")

      console.log("[v0] Making search request to YouTube Data API")
      const response = await fetch(searchUrl.toString())

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] YouTube search API error:", response.status, errorText)
        throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Search response received, items:", data.items?.length || 0)

      if (data.error) {
        console.error("[v0] YouTube API returned error:", data.error)
        throw new Error(`YouTube API Error: ${data.error.message}`)
      }

      if (!data.items || data.items.length === 0) {
        console.log("[v0] No search results found")
        return []
      }

      // Get video IDs for detailed info
      const videoIds = data.items.map((item: any) => item.id.videoId).join(",")

      // Get detailed video information
      const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos")
      detailsUrl.searchParams.set("part", "snippet,contentDetails,statistics")
      detailsUrl.searchParams.set("id", videoIds)
      detailsUrl.searchParams.set("key", this.apiKey)

      console.log("[v0] Getting detailed video information")
      const detailsResponse = await fetch(detailsUrl.toString())

      if (!detailsResponse.ok) {
        console.error("[v0] Video details API error:", detailsResponse.status)
        // Fallback to basic search results
        return this.mapBasicSearchResults(data.items)
      }

      const detailsData = await detailsResponse.json()
      console.log("[v0] Video details received, items:", detailsData.items?.length || 0)

      if (detailsData.error) {
        console.error("[v0] Video details API error:", detailsData.error)
        return this.mapBasicSearchResults(data.items)
      }

      return this.mapDetailedResults(detailsData.items || [])
    } catch (error) {
      console.error("[v0] YouTube search error:", error)
      throw error
    }
  }

  async getTrending(regionCode = "US"): Promise<YouTubeSearchResult[]> {
    try {
      console.log(`[v0] Getting trending videos for region: ${regionCode}`)

      const trendingUrl = new URL("https://www.googleapis.com/youtube/v3/videos")
      trendingUrl.searchParams.set("part", "snippet,statistics,contentDetails")
      trendingUrl.searchParams.set("chart", "mostPopular")
      trendingUrl.searchParams.set("regionCode", regionCode)
      trendingUrl.searchParams.set("videoCategoryId", "10") // Music category
      trendingUrl.searchParams.set("maxResults", "25")
      trendingUrl.searchParams.set("key", this.apiKey)

      console.log("[v0] Making trending request to YouTube Data API")
      const response = await fetch(trendingUrl.toString())

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] YouTube trending API error:", response.status, errorText)
        throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Trending response received, items:", data.items?.length || 0)

      if (data.error) {
        console.error("[v0] YouTube API returned error:", data.error)
        throw new Error(`YouTube API Error: ${data.error.message}`)
      }

      return this.mapDetailedResults(data.items || [])
    } catch (error) {
      console.error("[v0] YouTube trending error:", error)
      throw error
    }
  }

  private mapBasicSearchResults(items: any[]): YouTubeSearchResult[] {
    return items.map((item: any) => ({
      id: item.id.videoId || item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        "",
      duration: 0, // Duration not available in basic search
      publishedAt: item.snippet.publishedAt,
      viewCount: 0, // View count not available in basic search
      description: item.snippet.description || "",
    }))
  }

  private mapDetailedResults(items: any[]): YouTubeSearchResult[] {
    return items.map((item: any) => {
      const durationSeconds = this.parseDuration(item.contentDetails?.duration || "PT0S")

      return {
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        duration: this.formatDuration(durationSeconds),
        publishedAt: item.snippet.publishedAt,
        viewCount: Number.parseInt(item.statistics?.viewCount || "0"),
        description: item.snippet.description || "",
      }
    })
  }

  updateSettings(newSettings: Partial<YouTubeAPISettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    console.log("[v0] YouTube API settings updated:", this.settings)
  }

  getSettings(): YouTubeAPISettings {
    return { ...this.settings }
  }
}

export function createAdvancedYouTubeAPI(apiKey: string, settings?: Partial<YouTubeAPISettings>): AdvancedYouTubeAPI {
  const defaultSettings: YouTubeAPISettings = {
    highQuality: false,
    preferVideos: true,
    showVideos: false,
    highQualityAudio: false,
    preferOpus: true,
    adaptiveAudio: true,
  }

  return new AdvancedYouTubeAPI(apiKey, { ...defaultSettings, ...settings })
}

export { AudioQualityLevel, NetworkType } from "./enums"
