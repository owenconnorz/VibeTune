interface YouTubeMusicTrack {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  thumbnail: string
  audioUrl?: string
  videoUrl?: string
  source: "youtube-music"
}

interface YouTubeMusicSearchResult {
  tracks: YouTubeMusicTrack[]
  totalCount: number
  hasNextPage: boolean
  error?: string
}

class YouTubeMusicScraper {
  private baseUrl = "https://music.youtube.com"
  private apiKey = process.env.YOUTUBE_API_KEY || ""

  async search(query: string, page = 1, limit = 20): Promise<YouTubeMusicSearchResult> {
    try {
      console.log("[v0] YouTube Music Scraper: Searching for:", query)

      // Use YouTube Data API v3 for search
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&key=${this.apiKey}&maxResults=${limit}&pageToken=${page > 1 ? `page${page}` : ""}`

      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()

      const tracks: YouTubeMusicTrack[] =
        data.items?.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          duration: 0, // Will be fetched separately if needed
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          source: "youtube-music" as const,
        })) || []

      console.log(`[v0] YouTube Music Scraper: Found ${tracks.length} tracks`)

      return {
        tracks,
        totalCount: data.pageInfo?.totalResults || tracks.length,
        hasNextPage: !!data.nextPageToken,
      }
    } catch (error) {
      console.error("[v0] YouTube Music Scraper error:", error)
      return {
        tracks: [],
        totalCount: 0,
        hasNextPage: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getTrending(limit = 20): Promise<YouTubeMusicSearchResult> {
    try {
      console.log("[v0] YouTube Music Scraper: Getting trending music")

      // Get trending music videos
      const trendingUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&videoCategoryId=10&regionCode=US&maxResults=${limit}&key=${this.apiKey}`

      const response = await fetch(trendingUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()

      const tracks: YouTubeMusicTrack[] =
        data.items?.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          duration: 0,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
          source: "youtube-music" as const,
        })) || []

      console.log(`[v0] YouTube Music Scraper: Found ${tracks.length} trending tracks`)

      return {
        tracks,
        totalCount: tracks.length,
        hasNextPage: false,
      }
    } catch (error) {
      console.error("[v0] YouTube Music Scraper trending error:", error)
      return {
        tracks: [],
        totalCount: 0,
        hasNextPage: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getAudioUrl(videoId: string): Promise<string | null> {
    try {
      console.log("[v0] YouTube Music Scraper: Getting audio URL for:", videoId)

      // Use the existing ytdlp extractor for audio URLs
      const response = await fetch(`/api/innertube/stream?videoId=${videoId}`)
      const data = await response.json()

      if (data.audioUrl) {
        return data.audioUrl
      }

      // Fallback to YouTube URL
      return `https://www.youtube.com/watch?v=${videoId}`
    } catch (error) {
      console.error("[v0] YouTube Music Scraper audio URL error:", error)
      return `https://www.youtube.com/watch?v=${videoId}`
    }
  }
}

export const youtubeMusicScraper = new YouTubeMusicScraper()
export type { YouTubeMusicTrack, YouTubeMusicSearchResult }
