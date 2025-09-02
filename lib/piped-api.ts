import { PipedClient, type PipedStreamResponse, type SourceMap } from "./piped-client"

export interface PipedVideo {
  id: string
  title: string
  artist: string
  duration: string
  thumbnail: string
  url: string
  audioUrl?: string
  views?: string
  publishedAt?: string
  sourceMap?: SourceMap
  quality?: "high" | "medium" | "low"
}

export interface PipedSearchResponse {
  videos: PipedVideo[]
  totalResults: number
  nextPageToken?: string
}

export class PipedAPI {
  private client: PipedClient
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  constructor() {
    this.client = new PipedClient()
  }

  private async makeRequest(endpoint: string, params?: Record<string, string>): Promise<any> {
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log("[v0] Piped cache hit:", cacheKey)
      return cached.data
    }

    try {
      let result: any

      if (endpoint === "/search") {
        result = await this.client.search(params?.q || "", params?.filter as any)
      } else if (endpoint === "/trending") {
        result = await this.client.trending()
      } else if (endpoint.startsWith("/streams/")) {
        const videoId = endpoint.replace("/streams/", "")
        result = await this.client.streams(videoId)
      } else {
        throw new Error(`Unsupported endpoint: ${endpoint}`)
      }

      // Cache successful response
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error(`[v0] Piped API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  private parseVideo(item: any, streamData?: PipedStreamResponse): PipedVideo {
    const videoId = item.url?.replace("/watch?v=", "") || item.id

    // Extract artist and title from video title
    const fullTitle = item.title || "Unknown Title"
    const channelTitle = item.uploaderName || item.uploader || "Unknown Artist"

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

    let sourceMap: SourceMap | undefined
    let audioUrl: string | undefined

    if (streamData) {
      sourceMap = PipedClient.toSourceMap(streamData)
      // Prefer M4A high quality, fallback to WebM
      audioUrl = sourceMap.m4a.high || sourceMap.weba.high || undefined
    }

    return {
      id: videoId,
      title,
      artist,
      duration: this.formatDuration(item.duration || streamData?.duration || 210),
      thumbnail: item.thumbnail || item.thumbnailUrl || "/placeholder.svg?height=180&width=320",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      audioUrl,
      sourceMap,
      quality: "high",
      views: item.views?.toString(),
      publishedAt: item.uploadedDate || item.publishedText,
    }
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

  async search(query: string, maxResults = 20): Promise<PipedSearchResponse> {
    try {
      console.log(`[v0] Searching Piped API for: ${query}`)
      const data = await this.makeRequest("/search", {
        q: query,
        filter: "videos",
      })

      if (!data.items || data.items.length === 0) {
        console.log("[v0] No search results found")
        return { videos: [], totalResults: 0 }
      }

      const rankedResults = PipedClient.rankResults(data.items, { title: query, artist: "" })

      // Get detailed info for top results with stream data
      const videos = await Promise.all(
        rankedResults.slice(0, Math.min(maxResults, 5)).map(async (item: any) => {
          try {
            const videoId = item.url?.replace("/watch?v=", "") || item.id
            console.log(`[v0] Fetching streams for video: ${videoId}`)
            const streamData = await this.makeRequest(`/streams/${videoId}`)

            return this.parseVideo(item, streamData)
          } catch (error) {
            console.warn(`[v0] Failed to get streams for video ${item.id}:`, error)
            return this.parseVideo(item)
          }
        }),
      )

      const validVideos = videos.filter((v) => v !== null)
      console.log(`[v0] Successfully found ${validVideos.length} songs for query: ${query}`)

      return {
        videos: validVideos,
        totalResults: data.items.length,
      }
    } catch (error) {
      console.error("[v0] Piped search failed:", error)
      throw error
    }
  }

  async getTrending(maxResults = 20): Promise<PipedSearchResponse> {
    try {
      console.log("[v0] Fetching trending from Piped API")
      const data = await this.makeRequest("/trending")

      if (!data || data.length === 0) {
        return { videos: [], totalResults: 0 }
      }

      // Filter for music videos with better detection
      const musicVideos = data
        .filter((item: any) => {
          const title = item.title?.toLowerCase() || ""
          const uploader = item.uploaderName?.toLowerCase() || item.uploader?.toLowerCase() || ""

          return (
            title.includes("music") ||
            title.includes("song") ||
            title.includes("official") ||
            uploader.includes("music") ||
            uploader.includes("records") ||
            uploader.includes("entertainment") ||
            title.match(/\b(album|track|single|remix|cover)\b/i)
          )
        })
        .slice(0, maxResults)

      // Get stream data for music videos
      const videos = await Promise.all(
        musicVideos.slice(0, Math.min(maxResults, 5)).map(async (item: any) => {
          try {
            const videoId = item.url?.replace("/watch?v=", "") || item.id
            const streamData = await this.makeRequest(`/streams/${videoId}`)

            return this.parseVideo(item, streamData)
          } catch (error) {
            console.warn(`[v0] Failed to get streams for trending video ${item.id}:`, error)
            return this.parseVideo(item)
          }
        }),
      )

      const validVideos = videos.filter((v) => v !== null)
      console.log(`[v0] Got trending music: ${validVideos.length} songs`)

      return {
        videos: validVideos,
        totalResults: musicVideos.length,
      }
    } catch (error) {
      console.error("[v0] Piped trending failed:", error)
      throw error
    }
  }

  async getPlaylist(playlistId: string, maxResults = 50): Promise<PipedSearchResponse> {
    try {
      const data = await this.makeRequest(`/playlists/${playlistId}`)

      if (!data.relatedStreams || data.relatedStreams.length === 0) {
        return { videos: [], totalResults: 0 }
      }

      // Get detailed info for playlist videos
      const videos = await Promise.all(
        data.relatedStreams.slice(0, maxResults).map(async (item: any) => {
          try {
            const videoId = item.url?.replace("/watch?v=", "") || item.id
            const streamData = await this.makeRequest(`/streams/${videoId}`)

            return this.parseVideo({
              ...item,
              audioStreams: streamData.audioStreams,
              duration: streamData.duration,
            })
          } catch (error) {
            console.warn(`[v0] Failed to get streams for playlist video ${item.id}:`, error)
            return this.parseVideo(item)
          }
        }),
      )

      return {
        videos: videos.filter((v) => v !== null),
        totalResults: data.relatedStreams.length,
      }
    } catch (error) {
      console.error("[v0] Piped playlist failed:", error)
      throw error
    }
  }
}

// Factory function to create Piped API instance
export function createPipedAPI(): PipedAPI {
  return new PipedAPI()
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  duration: string
  thumbnail: string
  url: string
  audioUrl?: string
  source: string
}

export interface MusicSearchResult {
  tracks: MusicTrack[]
  totalResults: number
}

export class MusicAPIWrapper {
  private pipedAPI: PipedAPI
  private preferredQuality: "high" | "medium" | "low" = "high"

  constructor(pipedAPI: PipedAPI) {
    this.pipedAPI = pipedAPI
  }

  setQuality(quality: "high" | "medium" | "low") {
    this.preferredQuality = quality
    console.log(`[v0] Audio quality set to: ${quality}`)
  }

  async search(query: string, maxResults = 20): Promise<MusicSearchResult> {
    try {
      const result = await this.pipedAPI.search(query, maxResults)
      return {
        tracks: result.videos.map((video) => ({
          ...video,
          audioUrl: this.selectAudioUrl(video),
          source: "piped",
        })),
        totalResults: result.totalResults,
      }
    } catch (error) {
      console.error("[v0] Piped API search failed, using fallback:", error)
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
      const result = await this.pipedAPI.getTrending(maxResults)
      return {
        tracks: result.videos.map((video) => ({
          ...video,
          audioUrl: this.selectAudioUrl(video),
          source: "piped",
        })),
        totalResults: result.totalResults,
      }
    } catch (error) {
      console.error("[v0] Piped API trending failed, using fallback:", error)
      return {
        tracks: fallbackMusicData.slice(0, maxResults).map((video) => ({
          ...video,
          source: "fallback",
        })),
        totalResults: fallbackMusicData.length,
      }
    }
  }

  private selectAudioUrl(video: PipedVideo): string | undefined {
    if (!video.sourceMap) {
      return video.audioUrl
    }

    const { m4a, weba } = video.sourceMap

    // Prefer M4A format, fallback to WebM
    switch (this.preferredQuality) {
      case "high":
        return m4a.high || weba.high || m4a.medium || weba.medium
      case "medium":
        return m4a.medium || weba.medium || m4a.high || weba.high
      case "low":
        return m4a.low || weba.low || m4a.medium || weba.medium
      default:
        return m4a.high || weba.high
    }
  }
}

// Factory function to create Music API instance
export function createMusicAPI(): MusicAPIWrapper {
  const pipedAPI = createPipedAPI()
  return new MusicAPIWrapper(pipedAPI)
}

export const fallbackMusicData: PipedVideo[] = [
  {
    id: "fallback-1",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: "3:53",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "fallback-2",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
    thumbnail: "/weeknd-blinding-lights.png",
    url: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
    audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "fallback-3",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    duration: "3:20",
    thumbnail: "/taylor-swift-anti-hero.png",
    url: "https://www.youtube.com/watch?v=b1kbLWvqugk",
    audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "fallback-4",
    title: "As It Was",
    artist: "Harry Styles",
    duration: "2:47",
    thumbnail: "/harry-styles-as-it-was.png",
    url: "https://www.youtube.com/watch?v=H5v3kku4y6Q",
    audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "fallback-5",
    title: "Bad Habit",
    artist: "Steve Lacy",
    duration: "3:51",
    thumbnail: "/steve-lacy-bad-habit.png",
    url: "https://www.youtube.com/watch?v=VF-r5TtlT9w",
    audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
]
