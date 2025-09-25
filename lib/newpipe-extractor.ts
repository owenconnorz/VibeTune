// Web-compatible NewPipe extractor implementation
export interface NewPipeSong {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  url: string
  audioUrl: string
}

export interface NewPipeVideoInfo {
  id: string
  title: string
  uploader: string
  thumbnail: string
  duration: number
  webpage_url: string
  url: string
}

class NewPipeExtractor {
  private readonly INVIDIOUS_INSTANCES = [
    "https://invidious.io",
    "https://invidious.snopyta.org",
    "https://yewtu.be",
    "https://invidious.kavin.rocks",
  ]

  async getTrending(maxResults = 25): Promise<NewPipeSong[]> {
    console.log("[v0] NewPipe: Fetching trending music using Invidious API")

    try {
      // Use Invidious API to get trending videos
      const trendingData = await this.fetchFromInvidious("/api/v1/trending?type=music")

      if (!trendingData || !Array.isArray(trendingData)) {
        throw new Error("Invalid trending data received")
      }

      const songs = await this.convertToSongs(trendingData.slice(0, maxResults))
      console.log("[v0] NewPipe: Got", songs.length, "trending songs")
      return songs
    } catch (error) {
      console.error("[v0] NewPipe: Trending failed:", error)
      // Fallback to search-based trending
      return this.search("trending music 2024", maxResults)
    }
  }

  async search(query: string, maxResults = 15): Promise<NewPipeSong[]> {
    console.log("[v0] NewPipe: Searching using Invidious API for:", query)

    try {
      const searchData = await this.fetchFromInvidious(
        `/api/v1/search?q=${encodeURIComponent(query + " music")}&type=video`,
      )

      if (!searchData || !Array.isArray(searchData)) {
        throw new Error("Invalid search data received")
      }

      const songs = await this.convertToSongs(searchData.slice(0, maxResults))
      console.log("[v0] NewPipe: Got", songs.length, "search results")
      return songs
    } catch (error) {
      console.error("[v0] NewPipe: Search failed:", error)
      throw error
    }
  }

  private async fetchFromInvidious(endpoint: string): Promise<any> {
    let lastError: Error | null = null

    // Try each Invidious instance
    for (const instance of this.INVIDIOUS_INSTANCES) {
      try {
        console.log(`[v0] NewPipe: Trying ${instance}${endpoint}`)

        const response = await fetch(`${instance}${endpoint}`, {
          headers: {
            Accept: "application/json",
            "User-Agent": "VibeTune/1.0",
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`[v0] NewPipe: Successfully fetched from ${instance}`)
        return data
      } catch (error) {
        console.warn(`[v0] NewPipe: Failed to fetch from ${instance}:`, error)
        lastError = error as Error
        continue
      }
    }

    throw lastError || new Error("All Invidious instances failed")
  }

  private async convertToSongs(videos: any[]): Promise<NewPipeSong[]> {
    const songs: NewPipeSong[] = []

    for (const video of videos) {
      try {
        if (!video.videoId || !video.title) continue

        // Get audio stream URL
        const audioUrl = await this.getAudioUrl(video.videoId)

        const song: NewPipeSong = {
          id: video.videoId,
          title: video.title,
          artist: video.author || video.authorId || "Unknown Artist",
          thumbnail:
            video.videoThumbnails?.[0]?.url ||
            `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(video.title)}`,
          duration: this.formatDuration(video.lengthSeconds || 0),
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          audioUrl: audioUrl || "",
        }

        if (song.audioUrl) {
          songs.push(song)
        }
      } catch (error) {
        console.warn("[v0] NewPipe: Failed to convert video:", error)
      }
    }

    return songs
  }

  async getAudioUrl(videoId: string): Promise<string | null> {
    console.log("[v0] NewPipe: Getting audio URL for:", videoId)

    try {
      // Get video info with format streams
      const videoData = await this.fetchFromInvidious(`/api/v1/videos/${videoId}`)

      if (!videoData || !videoData.adaptiveFormats) {
        throw new Error("No adaptive formats found")
      }

      // Find best audio stream
      const audioStreams = videoData.adaptiveFormats.filter(
        (format: any) => format.type?.includes("audio") && format.url,
      )

      if (audioStreams.length === 0) {
        throw new Error("No audio streams found")
      }

      // Prefer m4a, then webm, then any audio
      const preferredStream =
        audioStreams.find((stream: any) => stream.type?.includes("audio/mp4") || stream.type?.includes("m4a")) ||
        audioStreams.find((stream: any) => stream.type?.includes("audio/webm")) ||
        audioStreams[0]

      console.log("[v0] NewPipe: Got audio URL for:", videoId)
      return preferredStream.url
    } catch (error) {
      console.error("[v0] NewPipe: Failed to get audio URL for:", videoId, error)
      return null
    }
  }

  async getPlaylist(playlistId: string, maxResults = 50): Promise<NewPipeSong[]> {
    console.log("[v0] NewPipe: Fetching playlist using Invidious API:", playlistId)

    try {
      const playlistData = await this.fetchFromInvidious(`/api/v1/playlists/${playlistId}`)

      if (!playlistData || !playlistData.videos) {
        throw new Error("Invalid playlist data received")
      }

      const songs = await this.convertToSongs(playlistData.videos.slice(0, maxResults))
      console.log("[v0] NewPipe: Successfully extracted", songs.length, "playlist songs")
      return songs
    } catch (error) {
      console.error("[v0] NewPipe: Playlist failed:", error)
      throw error
    }
  }

  private formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "0:00"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }
}

export const createNewPipeExtractor = () => new NewPipeExtractor()
export const newPipeExtractor = new NewPipeExtractor()
