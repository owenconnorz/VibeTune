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
}

export interface PipedSearchResponse {
  videos: PipedVideo[]
  totalResults: number
  nextPageToken?: string
}

export class PipedAPI {
  private baseUrl = "https://pipedapi.kavin.rocks"
  private fallbackInstances = [
    "https://piped-api.garudalinux.org",
    "https://pipedapi.rivo.lol",
    "https://piped-api.lunar.icu",
    "https://api-piped.mha.fi",
    "https://pipedapi.esmailelbob.xyz",
    "https://pipedapi.privacy.com.de",
    "https://api.piped.projectsegfau.lt",
  ]

  private async makeRequest(endpoint: string, params?: Record<string, string>): Promise<any> {
    const instances = [this.baseUrl, ...this.fallbackInstances]

    for (const instance of instances) {
      try {
        const url = new URL(`${instance}${endpoint}`)

        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value)
          })
        }

        console.log("[v0] Piped API request:", url.toString())

        const response = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": "VibeTune/1.0",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.warn(`[v0] Piped instance ${instance} failed:`, error)
        continue
      }
    }

    throw new Error("All Piped instances failed")
  }

  private parseVideo(item: any): PipedVideo {
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

    return {
      id: videoId,
      title,
      artist,
      duration: this.formatDuration(item.duration || 210),
      thumbnail: item.thumbnail || item.thumbnailUrl || "/placeholder.svg?height=180&width=320",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      audioUrl: item.audioStreams?.[0]?.url || undefined,
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
      const data = await this.makeRequest("/search", {
        q: query + " music",
        filter: "videos",
      })

      if (!data.items || data.items.length === 0) {
        return { videos: [], totalResults: 0 }
      }

      // Get detailed info for each video including audio streams
      const videos = await Promise.all(
        data.items.slice(0, maxResults).map(async (item: any) => {
          try {
            const videoId = item.url?.replace("/watch?v=", "") || item.id
            const streamData = await this.makeRequest(`/streams/${videoId}`)

            return this.parseVideo({
              ...item,
              audioStreams: streamData.audioStreams,
              duration: streamData.duration,
            })
          } catch (error) {
            console.warn(`[v0] Failed to get streams for video ${item.id}:`, error)
            return this.parseVideo(item)
          }
        }),
      )

      return {
        videos: videos.filter((v) => v !== null),
        totalResults: data.items.length,
      }
    } catch (error) {
      console.error("[v0] Piped search failed:", error)
      throw error
    }
  }

  async getTrending(maxResults = 20): Promise<PipedSearchResponse> {
    try {
      const data = await this.makeRequest("/trending", {
        region: "US",
      })

      if (!data || data.length === 0) {
        return { videos: [], totalResults: 0 }
      }

      // Filter for music videos and get detailed info
      const musicVideos = data
        .filter(
          (item: any) =>
            item.title?.toLowerCase().includes("music") ||
            item.uploaderName?.toLowerCase().includes("music") ||
            item.title?.match(/\b(song|album|track|music|official|video)\b/i),
        )
        .slice(0, maxResults)

      const videos = await Promise.all(
        musicVideos.map(async (item: any) => {
          try {
            const videoId = item.url?.replace("/watch?v=", "") || item.id
            const streamData = await this.makeRequest(`/streams/${videoId}`)

            return this.parseVideo({
              ...item,
              audioStreams: streamData.audioStreams,
              duration: streamData.duration,
            })
          } catch (error) {
            console.warn(`[v0] Failed to get streams for trending video ${item.id}:`, error)
            return this.parseVideo(item)
          }
        }),
      )

      return {
        videos: videos.filter((v) => v !== null),
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

  constructor(pipedAPI: PipedAPI) {
    this.pipedAPI = pipedAPI
  }

  async search(query: string, maxResults = 20): Promise<MusicSearchResult> {
    try {
      const result = await this.pipedAPI.search(query, maxResults)
      return {
        tracks: result.videos.map((video) => ({
          ...video,
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
}

// Fallback data for when API fails
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

export function createMusicAPI(): MusicAPIWrapper {
  const pipedAPI = createPipedAPI()
  return new MusicAPIWrapper(pipedAPI)
}
