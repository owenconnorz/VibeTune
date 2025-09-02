export interface YouTubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnails: {
    default: { url: string }
    medium: { url: string }
    high: { url: string }
  }
  duration: string
  publishedAt: string
}

export interface HybridSong {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  url: string
  audioUrl?: string
}

class YouTubePipedHybrid {
  private readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyBIQVGnXO2T7smsxf6q_MWxMD1sQzek1Nc"
  private readonly YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3"

  async getTrending(maxResults = 25): Promise<HybridSong[]> {
    console.log("[v0] Hybrid: Fetching trending from YouTube API")

    try {
      // Get trending music videos from YouTube
      const response = await fetch(
        `${this.YOUTUBE_BASE_URL}/videos?` +
          `part=snippet,contentDetails&` +
          `chart=mostPopular&` +
          `videoCategoryId=10&` + // Music category
          `regionCode=US&` +
          `maxResults=${maxResults}&` +
          `key=${this.YOUTUBE_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Hybrid: Got", data.items?.length || 0, "trending videos from YouTube")

      if (!data.items || data.items.length === 0) {
        throw new Error("No trending videos from YouTube API")
      }

      // Convert YouTube videos to HybridSong format
      const songs: HybridSong[] = data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url,
        duration: this.parseDuration(item.contentDetails?.duration || "PT0S"),
        url: `https://www.youtube.com/watch?v=${item.id}`,
        audioUrl: undefined, // Will be populated by Piped when needed
      }))

      console.log("[v0] Hybrid: Converted to", songs.length, "songs")
      return songs
    } catch (error) {
      console.error("[v0] Hybrid: YouTube trending failed:", error)
      throw error
    }
  }

  async search(query: string, maxResults = 15): Promise<HybridSong[]> {
    console.log("[v0] Hybrid: Searching YouTube API for:", query)

    try {
      const response = await fetch(
        `${this.YOUTUBE_BASE_URL}/search?` +
          `part=snippet&` +
          `q=${encodeURIComponent(query + " music")}&` +
          `type=video&` +
          `videoCategoryId=10&` +
          `maxResults=${maxResults}&` +
          `key=${this.YOUTUBE_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Hybrid: Got", data.items?.length || 0, "search results from YouTube")

      if (!data.items || data.items.length === 0) {
        return []
      }

      // Convert YouTube search results to HybridSong format
      const songs: HybridSong[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url,
        duration: "Unknown", // Duration not available in search results
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        audioUrl: undefined, // Will be populated by Piped when needed
      }))

      console.log("[v0] Hybrid: Converted to", songs.length, "songs")
      return songs
    } catch (error) {
      console.error("[v0] Hybrid: YouTube search failed:", error)
      throw error
    }
  }

  async getAudioUrl(videoId: string): Promise<string | null> {
    console.log("[v0] Hybrid: Getting audio URL from Piped for:", videoId)

    try {
      const { createPipedAPI } = await import("./piped-api")
      const pipedAPI = createPipedAPI()

      // Use Piped to get audio stream URL
      const streams = await pipedAPI.getStreams(videoId)

      if (streams && streams.length > 0) {
        // Prefer M4A format, fallback to WebM
        const m4aStream = streams.find((s) => s.format === "m4a")
        const webmStream = streams.find((s) => s.format === "webm")
        const audioUrl = m4aStream?.url || webmStream?.url || streams[0]?.url

        console.log("[v0] Hybrid: Got audio URL from Piped:", audioUrl ? "success" : "failed")
        return audioUrl || null
      }

      return null
    } catch (error) {
      console.error("[v0] Hybrid: Piped audio URL failed:", error)
      return null
    }
  }

  private parseDuration(duration: string): string {
    // Parse ISO 8601 duration (PT4M13S) to readable format (4:13)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return "0:00"

    const hours = Number.parseInt(match[1] || "0")
    const minutes = Number.parseInt(match[2] || "0")
    const seconds = Number.parseInt(match[3] || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }
}

export const createYouTubePipedHybrid = () => new YouTubePipedHybrid()
