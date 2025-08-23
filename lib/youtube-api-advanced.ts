import type { YouTubeAPISettings } from "./settings"
import type { AudioFormat, VideoFormat, StreamData } from "./stream-data"
import { AudioQualityLevel, NetworkType } from "./enums"
import { AUDIO_FORMAT_PRIORITY } from "./constants"

export interface YouTubeApiClient {
  makeRequest(endpoint: string, data: any): Promise<any>
  getContext(): any
}

export class AdvancedYouTubeAPI implements YouTubeApiClient {
  private settings: YouTubeAPISettings
  private visitorId: string | null = null
  private apiKey: string

  constructor(apiKey: string, settings: YouTubeAPISettings) {
    this.apiKey = apiKey
    this.settings = settings
  }

  private getRandomUserAgent(isMobile = true): string {
    const agents = isMobile ? ["Mobile User Agent"] : ["Desktop User Agent"]
    return agents[Math.floor(Math.random() * agents.length)]
  }

  private detectNetworkType(): NetworkType {
    // Simple network detection - in a real app this could be more sophisticated
    if (navigator.connection) {
      const connection = navigator.connection as any
      if (connection.effectiveType === "4g" || connection.effectiveType === "3g") {
        return NetworkType.MOBILE_DATA
      }
      if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
        return NetworkType.RESTRICTED_WIFI
      }
    }
    return NetworkType.WIFI
  }

  private getTargetAudioQuality(networkType: NetworkType): AudioQualityLevel {
    if (!this.settings.adaptiveAudio) {
      return this.settings.highQualityAudio ? AudioQualityLevel.HIGH : AudioQualityLevel.MEDIUM
    }

    switch (networkType) {
      case NetworkType.RESTRICTED_WIFI:
      case NetworkType.MOBILE_DATA:
        return AudioQualityLevel.MEDIUM
      case NetworkType.WIFI:
        return this.settings.highQualityAudio ? AudioQualityLevel.VERY_HIGH : AudioQualityLevel.HIGH
      default:
        return AudioQualityLevel.MEDIUM
    }
  }

  private getQualityRange(level: AudioQualityLevel): { min: number; max: number } {
    switch (level) {
      case AudioQualityLevel.LOW:
        return { min: 0, max: 64000 }
      case AudioQualityLevel.MEDIUM:
        return { min: 64001, max: 128000 }
      case AudioQualityLevel.HIGH:
        return { min: 128001, max: 256000 }
      case AudioQualityLevel.VERY_HIGH:
        return { min: 256001, max: Number.MAX_SAFE_INTEGER }
    }
  }

  private getBestAudioFormat(formats: AudioFormat[], networkType: NetworkType): AudioFormat | null {
    if (formats.length === 0) return null

    console.log(`[v0] Selecting best audio from ${formats.length} formats`)

    const targetQuality = this.getTargetAudioQuality(networkType)
    const qualityRange = this.getQualityRange(targetQuality)

    // Filter by format preference (Opus vs AAC)
    const opusFormats = formats.filter((f) => f.mimeType.includes("opus") || f.mimeType.includes("webm"))
    const aacFormats = formats.filter((f) => f.mimeType.includes("aac") || f.mimeType.includes("mp4"))

    const preferredFormats =
      this.settings.preferOpus && opusFormats.length > 0 ? opusFormats : aacFormats.length > 0 ? aacFormats : formats

    // Filter by quality range
    const qualityFiltered = preferredFormats.filter(
      (f) => f.bitrate >= qualityRange.min && f.bitrate <= qualityRange.max,
    )

    const finalFormats = qualityFiltered.length > 0 ? qualityFiltered : preferredFormats

    // Sort by priority and select best
    const sorted = finalFormats.sort((a, b) => {
      const aPriority = AUDIO_FORMAT_PRIORITY.indexOf(a.itag)
      const bPriority = AUDIO_FORMAT_PRIORITY.indexOf(b.itag)

      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority
      }
      if (aPriority !== -1) return -1
      if (bPriority !== -1) return 1

      return b.bitrate - a.bitrate
    })

    const selected = sorted[0]
    console.log(`[v0] Selected audio format: itag ${selected?.itag}, bitrate ${selected?.bitrate}`)

    return selected
  }

  private getBestVideoFormat(formats: VideoFormat[], targetQuality?: number): VideoFormat | null {
    if (formats.length === 0 || !this.settings.showVideos) return null

    console.log(`[v0] Selecting best video from ${formats.length} formats, target: ${targetQuality || "any"}`)

    if (!targetQuality) {
      return formats.reduce((best, current) => (current.bitrate > best.bitrate ? current : best))
    }

    // Filter by target quality
    const filtered = formats.filter((f) => {
      if (!f.height) return true

      switch (targetQuality) {
        case 144:
          return f.height <= 144
        case 480:
          return f.height <= 480 && f.height > 144
        case 720:
          return f.height <= 720 && f.height > 480
        default:
          return true
      }
    })

    const finalFormats = filtered.length > 0 ? filtered : formats
    const selected = finalFormats.reduce((best, current) => (current.bitrate > best.bitrate ? current : best))

    console.log(`[v0] Selected video format: ${selected?.height}p, bitrate ${selected?.bitrate}`)
    return selected
  }

  async makeRequest(endpoint: string, data: any = {}): Promise<any> {
    try {
      const networkType = this.detectNetworkType()
      const isMobile = networkType === NetworkType.MOBILE_DATA

      const url = endpoint.startsWith("http") ? endpoint : `https://music.youtube.com/youtubei/v1${endpoint}`

      const headers = {
        "User-Agent": this.getRandomUserAgent(isMobile),
        "Content-Type": "application/json",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Origin: "https://music.youtube.com",
        Referer: "https://music.youtube.com/",
        "X-Goog-Api-Format-Version": "1",
        "X-YouTube-Client-Name": "67",
        "X-YouTube-Client-Version": "1.20241211.01.00",
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[v0] API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  getContext(): any {
    return {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: "1.20241211.01.00",
        userAgent: this.getRandomUserAgent(true),
        gl: "US",
        hl: "en",
      },
      user: {
        lockedSafetyMode: false,
      },
      request: {
        useSsl: true,
        internalExperimentFlags: [],
      },
    }
  }

  async ensureVisitorId(): Promise<void> {
    if (this.visitorId) return

    try {
      const response = await this.makeRequest("/visitor_id", {
        context: this.getContext(),
      })
      this.visitorId = response.responseContext?.visitorData
      console.log(`[v0] Visitor ID obtained: ${this.visitorId}`)
    } catch (error) {
      console.error("[v0] Failed to get visitor ID:", error)
    }
  }

  async searchMusic(
    query: string,
    type: "all" | "songs" | "videos" | "albums" | "playlists" | "artists" = "all",
  ): Promise<any[]> {
    try {
      console.log(`[v0] Searching music for: ${query} (type: ${type})`)
      await this.ensureVisitorId()

      const results = await this.search(query, "music")
      console.log(`[v0] Found ${results.length} search results`)

      return results
    } catch (error) {
      console.error("[v0] Music search error:", error)
      throw error
    }
  }

  async getTrendingMusic(regionCode = "US"): Promise<any[]> {
    try {
      console.log(`[v0] Getting trending music for region: ${regionCode}`)
      await this.ensureVisitorId()

      const results = await this.getTrending(regionCode)
      console.log(`[v0] Found ${results.length} trending tracks`)

      return results
    } catch (error) {
      console.error("[v0] Trending music error:", error)
      throw error
    }
  }

  async getStreamData(videoId: string): Promise<StreamData> {
    try {
      console.log(`[v0] Getting stream data for video: ${videoId}`)
      await this.ensureVisitorId()

      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`
      const response = await fetch(videoUrl)
      const data = await response.json()

      if (data.error || !data.items?.length) {
        throw new Error(`Video not found: ${videoId}`)
      }

      const video = data.items[0]
      const networkType = this.detectNetworkType()

      // Return basic stream data structure
      return {
        audioFormats: [],
        videoFormats: [],
        title: video.snippet.title,
        duration: this.parseDuration(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || "",
        author: video.snippet.channelTitle,
        viewCount: 0,
      }
    } catch (error) {
      console.error("[v0] Stream data error:", error)
      throw error
    }
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return 0

    const hours = Number.parseInt(match[1]?.replace("H", "") || "0")
    const minutes = Number.parseInt(match[2]?.replace("M", "") || "0")
    const seconds = Number.parseInt(match[3]?.replace("S", "") || "0")

    return hours * 3600 + minutes * 60 + seconds
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      await this.ensureVisitorId()
      return []
    } catch (error) {
      console.error("[v0] Search suggestions error:", error)
      return []
    }
  }

  async getArtist(artistId: string): Promise<any> {
    try {
      await this.ensureVisitorId()
      return null
    } catch (error) {
      console.error("[v0] Get artist error:", error)
      throw error
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    try {
      await this.ensureVisitorId()
      return null
    } catch (error) {
      console.error("[v0] Get playlist error:", error)
      throw error
    }
  }

  async getLyrics(videoId: string, trackTitle: string): Promise<any> {
    try {
      await this.ensureVisitorId()
      return null
    } catch (error) {
      console.error("[v0] Get lyrics error:", error)
      return null
    }
  }

  async search(query: string, type: "video" | "music" = "music"): Promise<any[]> {
    try {
      console.log(`[v0] Searching YouTube for: ${query}`)

      const searchUrl =
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&q=${encodeURIComponent(query)}&` +
        `maxResults=25&key=${this.apiKey}`

      const response = await fetch(searchUrl)
      const data = await response.json()

      if (data.error) {
        throw new Error(`YouTube API Error: ${data.error.message}`)
      }

      return (
        data.items?.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          duration: 0, // Would need additional API call to get duration
          publishedAt: item.snippet.publishedAt,
        })) || []
      )
    } catch (error) {
      console.error("[v0] YouTube search error:", error)
      throw error
    }
  }

  async getTrending(regionCode = "US"): Promise<any[]> {
    try {
      console.log(`[v0] Getting trending videos for region: ${regionCode}`)

      const trendingUrl =
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&` +
        `videoCategoryId=10&maxResults=25&key=${this.apiKey}`

      const response = await fetch(trendingUrl)
      const data = await response.json()

      if (data.error) {
        throw new Error(`YouTube API Error: ${data.error.message}`)
      }

      return (
        data.items?.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          duration: 0,
          viewCount: Number.parseInt(item.statistics?.viewCount || "0"),
          publishedAt: item.snippet.publishedAt,
        })) || []
      )
    } catch (error) {
      console.error("[v0] YouTube trending error:", error)
      throw error
    }
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
