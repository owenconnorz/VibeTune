interface PipedVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: number
  viewCount?: number
  publishedTimeText?: string
}

interface PipedStreamData {
  title: string
  duration: number
  thumbnailUrl: string
  audioStreams: Array<{
    url: string
    mimeType: string
    bitrate: string
    quality: string
    codec?: string
  }>
}

interface PipedSearchResponse {
  items: Array<{
    url: string
    title: string
    uploaderName: string
    thumbnail: string
    duration: number
    views?: number
    uploadedDate?: string
  }>
}

interface PipedTrendingResponse {
  items: Array<{
    url: string
    title: string
    uploaderName: string
    thumbnail: string
    duration: number
    views?: number
    uploadedDate?: string
  }>
}

interface PipedStreamsResponse {
  title: string
  duration: number
  thumbnailUrl: string
  audioStreams: Array<{
    url: string
    mimeType: string
    bitrate: number
    quality: string
    codec?: string
  }>
}

class PipedAPI {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl = "https://pipedapi.kavin.rocks", timeout = 10000) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      console.log(`[v0] Piped API request: ${this.baseUrl}${endpoint}`)

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Piped API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`[v0] Piped API response received for ${endpoint}`)
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`[v0] Piped API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  private extractVideoId(url: string): string {
    const match = url.match(/\/watch\?v=([^&]+)/)
    return match ? match[1] : url
  }

  private convertToStandardFormat(item: any): PipedVideo {
    const videoId = this.extractVideoId(item.url || "")

    return {
      id: videoId,
      title: item.title || "Unknown Title",
      channelTitle: item.uploaderName || "Unknown Artist",
      thumbnail: item.thumbnail || "/placeholder.svg?height=180&width=320",
      duration: item.duration || 0,
      viewCount: item.views,
      publishedTimeText: item.uploadedDate,
    }
  }

  async search(query: string, maxResults = 20): Promise<{ videos: PipedVideo[] }> {
    try {
      const encodedQuery = encodeURIComponent(query)
      const data = await this.makeRequest<PipedSearchResponse>(`/search?q=${encodedQuery}&filter=music_songs`)

      const videos = (data.items || [])
        .slice(0, maxResults)
        .map((item) => this.convertToStandardFormat(item))
        .filter((video) => video.id && video.title)

      console.log(`[v0] Piped search returned ${videos.length} videos for query: ${query}`)

      return { videos }
    } catch (error) {
      console.error("[v0] Piped search failed:", error)
      return { videos: [] }
    }
  }

  async getTrending(maxResults = 20): Promise<PipedVideo[]> {
    try {
      const data = await this.makeRequest<PipedTrendingResponse>("/trending?region=US")

      const videos = (data.items || [])
        .slice(0, maxResults)
        .map((item) => this.convertToStandardFormat(item))
        .filter((video) => video.id && video.title)

      console.log(`[v0] Piped trending returned ${videos.length} videos`)

      return videos
    } catch (error) {
      console.error("[v0] Piped trending failed:", error)
      return []
    }
  }

  async getStreams(videoId: string): Promise<PipedStreamData> {
    try {
      const data = await this.makeRequest<PipedStreamsResponse>(`/streams/${videoId}`)

      const audioStreams = (data.audioStreams || [])
        .filter((stream) => stream.url && stream.mimeType)
        .map((stream) => ({
          url: stream.url,
          mimeType: stream.mimeType,
          bitrate: stream.bitrate?.toString() || "128",
          quality: stream.quality || "medium",
          codec: stream.codec,
        }))

      console.log(`[v0] Piped streams returned ${audioStreams.length} audio streams for ${videoId}`)

      return {
        title: data.title || "Unknown Title",
        duration: data.duration || 0,
        thumbnailUrl: data.thumbnailUrl || "/placeholder.svg?height=180&width=320",
        audioStreams,
      }
    } catch (error) {
      console.error(`[v0] Piped streams failed for ${videoId}:`, error)
      throw error
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      const encodedQuery = encodeURIComponent(query)
      const data = await this.makeRequest<string[]>(`/suggestions?query=${encodedQuery}`)

      console.log(`[v0] Piped suggestions returned ${data.length} suggestions for: ${query}`)

      return data || []
    } catch (error) {
      console.error("[v0] Piped suggestions failed:", error)
      return []
    }
  }
}

export function createPipedAPI(): PipedAPI {
  return new PipedAPI()
}

export type { PipedVideo, PipedStreamData }
