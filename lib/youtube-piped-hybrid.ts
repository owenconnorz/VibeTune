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
        const errorText = await response.text()
        console.error("[v0] Hybrid: YouTube API error response:", response.status, errorText)

        if (response.status === 403) {
          console.error("[v0] Hybrid: YouTube API 403 - API key invalid or quota exceeded")
          // Try fallback to mock data for development
          return this.getMockTrendingData()
        }

        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Hybrid: Got", data.items?.length || 0, "trending videos from YouTube")

      if (!data.items || data.items.length === 0) {
        console.warn("[v0] Hybrid: No trending videos from YouTube API, using mock data")
        return this.getMockTrendingData()
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
        audioUrl: undefined, // Will be populated by yt-dlp when needed
      }))

      console.log("[v0] Hybrid: Converted to", songs.length, "songs")
      return songs
    } catch (error) {
      console.error("[v0] Hybrid: YouTube trending failed:", error)
      console.log("[v0] Hybrid: Using mock trending data as fallback")
      return this.getMockTrendingData()
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
        const errorText = await response.text()
        console.error("[v0] Hybrid: YouTube search API error:", response.status, errorText)

        if (response.status === 403) {
          console.error("[v0] Hybrid: YouTube API 403 - API key invalid or quota exceeded")
          return this.getMockSearchData(query)
        }

        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Hybrid: Got", data.items?.length || 0, "search results from YouTube")

      if (!data.items || data.items.length === 0) {
        return this.getMockSearchData(query)
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
        audioUrl: undefined, // Will be populated by yt-dlp when needed
      }))

      console.log("[v0] Hybrid: Converted to", songs.length, "songs")
      return songs
    } catch (error) {
      console.error("[v0] Hybrid: YouTube search failed:", error)
      console.log("[v0] Hybrid: Using mock search data as fallback")
      return this.getMockSearchData(query)
    }
  }

  private getMockTrendingData(): HybridSong[] {
    return [
      {
        id: "mock-1",
        title: "Trending Song 1 (Demo)",
        artist: "Demo Artist",
        thumbnail: "/abstract-soundscape.png",
        duration: "3:45",
        url: "https://www.youtube.com/watch?v=mock-1",
      },
      {
        id: "mock-2",
        title: "Popular Track 2 (Demo)",
        artist: "Sample Artist",
        thumbnail: "/music-vinyl-record.jpg",
        duration: "4:12",
        url: "https://www.youtube.com/watch?v=mock-2",
      },
      {
        id: "mock-3",
        title: "Hit Song 3 (Demo)",
        artist: "Example Band",
        thumbnail: "/concert-stage-lights.png",
        duration: "3:28",
        url: "https://www.youtube.com/watch?v=mock-3",
      },
    ]
  }

  private getMockSearchData(query: string): HybridSong[] {
    return [
      {
        id: `mock-search-1-${Date.now()}`,
        title: `${query} - Result 1 (Demo)`,
        artist: "Search Demo Artist",
        thumbnail: "/music-search-results.jpg",
        duration: "3:30",
        url: `https://www.youtube.com/watch?v=mock-search-1`,
      },
      {
        id: `mock-search-2-${Date.now()}`,
        title: `${query} - Result 2 (Demo)`,
        artist: "Demo Search Band",
        thumbnail: "/music-headphones.jpg",
        duration: "4:05",
        url: `https://www.youtube.com/watch?v=mock-search-2`,
      },
    ]
  }

  async getAudioUrl(videoId: string): Promise<string | null> {
    console.log("[v0] Hybrid: Getting audio URL from yt-dlp for:", videoId)

    try {
      const { createYtDlpExtractor } = await import("./ytdlp-extractor")
      const ytdlp = createYtDlpExtractor()

      // Use yt-dlp to get direct audio stream URL
      const audioUrl = await ytdlp.getAudioUrl(videoId)

      console.log("[v0] Hybrid: Got audio URL from yt-dlp:", audioUrl ? "success" : "failed")
      return audioUrl
    } catch (error) {
      console.error("[v0] Hybrid: yt-dlp audio URL failed:", error)
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
