export interface YouTubeAPISettings {
  highQuality: boolean
  preferVideos: boolean
  showVideos: boolean
  highQualityAudio: boolean
  preferOpus: boolean
  adaptiveAudio: boolean
}

export interface AudioFormat {
  itag: number
  url: string
  mimeType: string
  bitrate: number
  audioSampleRate?: number
  audioChannels?: number
}

export interface VideoFormat {
  itag: number
  url: string
  mimeType: string
  bitrate: number
  width?: number
  height?: number
  fps?: number
}

export interface StreamData {
  audioFormats: AudioFormat[]
  videoFormats: VideoFormat[]
  title: string
  duration: number
  thumbnail: string
  author: string
  viewCount?: number
}

export enum AudioQualityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

export enum NetworkType {
  WIFI = "wifi",
  MOBILE_DATA = "mobile_data",
  RESTRICTED_WIFI = "restricted_wifi",
}

// Audio format constants based on YouTube itags
export const AUDIO_FORMAT_BITRATES: Record<number, number> = {
  139: 48000, // AAC HE 48kbps
  140: 128000, // AAC LC 128kbps
  141: 256000, // AAC LC 256kbps
  249: 50000, // Opus 50kbps
  250: 70000, // Opus 70kbps
  251: 128000, // Opus 128kbps
  256: 192000, // AAC HE 192kbps 5.1
  258: 384000, // AAC LC 384kbps 5.1
  327: 256000, // AAC LC 256kbps 5.1
  338: 480000, // Opus 480kbps Ambisonic
  599: 30000, // AAC HE 30kbps
  600: 35000, // Opus 35kbps
  773: 900000, // IAMF 900kbps
  774: 256000, // Opus 256kbps
}

export const AUDIO_FORMAT_PRIORITY = [773, 774, 141, 251, 140, 250, 249, 139, 600, 599]

const MOBILE_USER_AGENTS = [
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
]

const DESKTOP_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
]

export class AdvancedYouTubeAPI {
  private settings: YouTubeAPISettings
  private visitorId: string | null = null
  private apiKey: string

  constructor(apiKey: string, settings: YouTubeAPISettings) {
    this.apiKey = apiKey
    this.settings = settings
  }

  private getRandomUserAgent(isMobile = true): string {
    const agents = isMobile ? MOBILE_USER_AGENTS : DESKTOP_USER_AGENTS
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

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const networkType = this.detectNetworkType()
    const isMobile = networkType === NetworkType.MOBILE_DATA

    const headers = {
      "User-Agent": this.getRandomUserAgent(isMobile),
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Origin: "https://music.youtube.com",
      Referer: "https://music.youtube.com/",
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }

  async search(query: string, type: "video" | "music" = "music"): Promise<any[]> {
    try {
      console.log(`[v0] Searching YouTube for: ${query}`)

      const searchUrl =
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&q=${encodeURIComponent(query)}&` +
        `maxResults=25&key=${this.apiKey}`

      const response = await this.makeRequest(searchUrl)
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

      const response = await this.makeRequest(trendingUrl)
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

  async getStreamData(videoId: string): Promise<StreamData> {
    try {
      console.log(`[v0] Getting stream data for video: ${videoId}`)

      // This would typically require a more complex implementation
      // For now, we'll return a mock structure that would be populated
      // by a proper YouTube stream extraction service

      const videoUrl =
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,contentDetails,statistics&id=${videoId}&key=${this.apiKey}`

      const response = await this.makeRequest(videoUrl)
      const data = await response.json()

      if (data.error) {
        throw new Error(`YouTube API Error: ${data.error.message}`)
      }

      const video = data.items?.[0]
      if (!video) {
        throw new Error("Video not found")
      }

      // In a real implementation, this would extract actual stream URLs
      // For now, we return the basic video info
      return {
        audioFormats: [], // Would be populated by stream extraction
        videoFormats: [], // Would be populated by stream extraction
        title: video.snippet.title,
        duration: this.parseDuration(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url,
        author: video.snippet.channelTitle,
        viewCount: Number.parseInt(video.statistics?.viewCount || "0"),
      }
    } catch (error) {
      console.error("[v0] Stream data error:", error)
      throw error
    }
  }

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration (PT4M13S -> 253 seconds)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = Number.parseInt(match[1] || "0")
    const minutes = Number.parseInt(match[2] || "0")
    const seconds = Number.parseInt(match[3] || "0")

    return hours * 3600 + minutes * 60 + seconds
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
