// YouTube API utility functions for fetching music data using YouTube Data API v3

export interface YouTubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: string
  viewCount: string
  publishedAt: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  nextPageToken?: string
}

export interface YouTubePlaylist {
  id: string
  title: string
  description: string
  thumbnail: string
  videoCount: number
  privacy: string
  publishedAt: string
}

const FALLBACK_TRENDING_SONGS: YouTubeVideo[] = [
  {
    id: "fallback1",
    title: "Beautiful",
    channelTitle: "Eminem",
    thumbnail: "/placeholder.svg?height=300&width=300",
    duration: "6:17",
    viewCount: "1000000",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "fallback2",
    title: "The Look",
    channelTitle: "Roxette",
    thumbnail: "/placeholder.svg?height=300&width=300",
    duration: "3:58",
    viewCount: "500000",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "fallback3",
    title: "Sucker for Pain",
    channelTitle: "Lil Wayne, Wiz Khalifa, Imagine Dragons",
    thumbnail: "/placeholder.svg?height=300&width=300",
    duration: "4:03",
    viewCount: "2000000",
    publishedAt: new Date().toISOString(),
  },
]

const FALLBACK_SEARCH_SONGS: YouTubeVideo[] = [
  {
    id: "search1",
    title: "Sample Song 1",
    channelTitle: "Sample Artist",
    thumbnail: "/placeholder.svg?height=300&width=300",
    duration: "3:30",
    viewCount: "100000",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "search2",
    title: "Sample Song 2",
    channelTitle: "Another Artist",
    thumbnail: "/placeholder.svg?height=300&width=300",
    duration: "4:15",
    viewCount: "200000",
    publishedAt: new Date().toISOString(),
  },
]

export class YouTubeAPI {
  private baseUrl = "https://www.googleapis.com/youtube/v3"
  private apiKey: string
  private quotaExceeded = false
  private lastQuotaCheck = 0
  private quotaResetTime = 24 * 60 * 60 * 1000 // 24 hours

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || "AIzaSyBIQVGnXO2T7smsxf6q_MWxMD1sQzek1Nc"
    console.log("[v0] YouTube API initialized")
    console.log("[v0] API key exists:", !!this.apiKey)
    console.log("[v0] API key source:", apiKey ? "parameter" : process.env.YOUTUBE_API_KEY ? "environment" : "fallback")
    console.log("[v0] Environment YOUTUBE_API_KEY exists:", !!process.env.YOUTUBE_API_KEY)
  }

  private isQuotaExceeded(): boolean {
    const now = Date.now()
    if (now - this.lastQuotaCheck > this.quotaResetTime) {
      this.quotaExceeded = false
      this.lastQuotaCheck = now
    }
    return this.quotaExceeded
  }

  private markQuotaExceeded(): void {
    this.quotaExceeded = true
    this.lastQuotaCheck = Date.now()
  }

  async searchMusic(query: string, maxResults = 20): Promise<YouTubeSearchResult> {
    console.log("[v0] Starting searchMusic for query:", query)

    if (this.isQuotaExceeded()) {
      console.log("[v0] Quota exceeded, returning fallback data")
      return {
        videos: FALLBACK_SEARCH_SONGS.filter(
          (song) =>
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.channelTitle.toLowerCase().includes(query.toLowerCase()),
        ).slice(0, maxResults),
        nextPageToken: undefined,
      }
    }

    try {
      const url = new URL(`${this.baseUrl}/search`)
      url.searchParams.set("part", "snippet")
      const musicQuery = `${query} music song audio track official`
      url.searchParams.set("q", musicQuery)
      url.searchParams.set("type", "video")
      url.searchParams.set("maxResults", Math.min(maxResults * 2, 50).toString())
      url.searchParams.set("order", "relevance")
      url.searchParams.set("videoDuration", "medium")
      url.searchParams.set("videoDefinition", "any")
      url.searchParams.set("videoCategoryId", "10")
      url.searchParams.set("key", this.apiKey)

      console.log("[v0] Making YouTube API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] YouTube API response status:", response.status)
      console.log("[v0] YouTube API response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] YouTube API error response:", errorText)

        if (response.status === 403) {
          console.log("[v0] 403 error - marking quota as exceeded")
          this.markQuotaExceeded()
          return {
            videos: FALLBACK_SEARCH_SONGS.slice(0, maxResults),
            nextPageToken: undefined,
          }
        }
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] YouTube API returned", data.items?.length || 0, "items")

      const videos = this.parseSearchResults(data.items || [])
      const filteredVideos = this.filterMusicContent(videos).slice(0, maxResults)

      console.log("[v0] Filtered to", filteredVideos.length, "music videos")

      return {
        videos: filteredVideos,
        nextPageToken: data.nextPageToken,
      }
    } catch (error) {
      console.error("[v0] YouTube API searchMusic error:", error)
      console.log("[v0] Returning fallback search data due to error")
      return {
        videos: FALLBACK_SEARCH_SONGS.slice(0, maxResults),
        nextPageToken: undefined,
      }
    }
  }

  async getTrendingMusic(maxResults = 20): Promise<YouTubeVideo[]> {
    console.log("[v0] Starting getTrendingMusic")

    if (this.isQuotaExceeded()) {
      console.log("[v0] Quota exceeded, returning fallback trending data")
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
    }

    try {
      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set("part", "snippet,statistics,contentDetails")
      url.searchParams.set("chart", "mostPopular")
      url.searchParams.set("videoCategoryId", "10")
      url.searchParams.set("regionCode", "US")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      console.log("[v0] Making trending API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] Trending API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Trending API error response:", errorText)

        if (response.status === 403) {
          console.log("[v0] 403 error - marking quota as exceeded")
          this.markQuotaExceeded()
          return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
        }
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Trending API returned", data.items?.length || 0, "items")

      const videos = this.parseTrendingResults(data.items || [])
      console.log("[v0] Parsed", videos.length, "trending videos")

      return videos
    } catch (error) {
      console.error("[v0] YouTube API getTrendingMusic error:", error)
      console.log("[v0] Returning fallback trending data due to error")
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
    }
  }

  async getPlaylistVideos(playlistId: string, maxResults = 50): Promise<YouTubeVideo[]> {
    console.log("[v0] Starting getPlaylistVideos for playlistId:", playlistId)

    if (this.isQuotaExceeded()) {
      console.log("[v0] Quota exceeded, returning fallback playlist data")
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
    }

    try {
      const url = new URL(`${this.baseUrl}/playlistItems`)
      url.searchParams.set("part", "snippet")
      url.searchParams.set("playlistId", playlistId)
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      console.log("[v0] Making playlist API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] Playlist API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Playlist API error response:", errorText)

        if (response.status === 403) {
          console.log("[v0] 403 error - marking quota as exceeded")
          this.markQuotaExceeded()
          return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
        }
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Playlist API returned", data.items?.length || 0, "items")

      const videos = this.parsePlaylistResults(data.items || [])
      console.log("[v0] Parsed", videos.length, "playlist videos")

      return videos
    } catch (error) {
      console.error("[v0] YouTube API getPlaylistVideos error:", error)
      console.log("[v0] Returning fallback playlist data due to error")
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
    }
  }

  async getUserPlaylists(accessToken: string, maxResults = 25): Promise<YouTubePlaylist[]> {
    try {
      const url = new URL(`${this.baseUrl}/playlists`)
      url.searchParams.set("part", "snippet,contentDetails")
      url.searchParams.set("mine", "true")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      console.log("[v0] Making user playlists API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] User playlists API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] User playlists API error response:", errorText)
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] User playlists API returned", data.items?.length || 0, "items")

      const playlists = this.parsePlaylistsResults(data.items || [])
      console.log("[v0] Parsed", playlists.length, "user playlists")

      return playlists
    } catch (error) {
      console.error("[v0] User playlists error:", error)
      throw error
    }
  }

  async getLikedVideos(accessToken: string, maxResults = 50): Promise<YouTubeVideo[]> {
    try {
      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set("part", "snippet,statistics,contentDetails")
      url.searchParams.set("myRating", "like")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      console.log("[v0] Making liked videos API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] Liked videos API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Liked videos API error response:", errorText)
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Liked videos API returned", data.items?.length || 0, "items")

      const videos = this.parseTrendingResults(data.items || [])
      console.log("[v0] Parsed", videos.length, "liked videos")

      return videos
    } catch (error) {
      console.error("[v0] Liked videos error:", error)
      throw error
    }
  }

  private parseSearchResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.id?.videoId || item.id,
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=300&width=300",
      duration: "3:30",
      viewCount: "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parseTrendingResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.id,
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=300&width=300",
      duration: this.parseDuration(item.contentDetails?.duration || "PT3M30S"),
      viewCount: item.statistics?.viewCount || "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parsePlaylistResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.snippet?.resourceId?.videoId || "",
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "Unknown Channel",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=300&width=300",
      duration: "3:30",
      viewCount: "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parsePlaylistsResults(items: any[]): YouTubePlaylist[] {
    return items.map((item) => ({
      id: item.id,
      title: item.snippet?.title || "Unknown Playlist",
      description: item.snippet?.description || "",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      videoCount: item.contentDetails?.itemCount || 0,
      privacy: item.status?.privacyStatus || "private",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parseDuration(duration: string): string {
    if (!duration || !duration.startsWith("PT")) return "3:30"

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return "3:30"

    const hours = Number.parseInt(match[1] || "0")
    const minutes = Number.parseInt(match[2] || "0")
    const seconds = Number.parseInt(match[3] || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
  }

  private filterMusicContent(videos: YouTubeVideo[]): YouTubeVideo[] {
    const musicKeywords = [
      "official",
      "music",
      "song",
      "audio",
      "track",
      "album",
      "single",
      "remix",
      "cover",
      "acoustic",
      "live",
      "performance",
      "concert",
      "studio",
      "version",
      "ft.",
      "feat.",
      "featuring",
      "vevo",
      "records",
      "music video",
      "mv",
      "lyric",
      "lyrics",
      "instrumental",
      "karaoke",
      "unplugged",
      "sessions",
      "radio edit",
      "extended",
      "original mix",
      "clean version",
      "explicit",
    ]

    const highPriorityKeywords = [
      "vevo",
      "official",
      "music video",
      "official video",
      "official audio",
      "official music video",
    ]

    const musicChannelKeywords = ["vevo", "records", "music", "entertainment", "official", "label", "studios"]

    const nonMusicKeywords = [
      "tutorial",
      "how to",
      "review",
      "reaction",
      "vlog",
      "interview",
      "documentary",
      "news",
      "talk show",
      "podcast",
      "gameplay",
      "unboxing",
      "behind the scenes",
      "making of",
      "breakdown",
      "analysis",
      "explained",
      "theory",
      "lesson",
      "course",
    ]

    return videos
      .map((video) => {
        const title = video.title.toLowerCase()
        const channelTitle = video.channelTitle.toLowerCase()
        let score = 0

        // High priority content
        highPriorityKeywords.forEach((keyword) => {
          if (title.includes(keyword) || channelTitle.includes(keyword)) {
            score += 10
          }
        })

        // Music channel bonus
        musicChannelKeywords.forEach((keyword) => {
          if (channelTitle.includes(keyword)) {
            score += 5
          }
        })

        // General music keywords
        musicKeywords.forEach((keyword) => {
          if (title.includes(keyword) || channelTitle.includes(keyword)) {
            score += 2
          }
        })

        // Penalty for non-music content
        nonMusicKeywords.forEach((keyword) => {
          if (title.includes(keyword)) {
            score -= 5
          }
        })

        return { ...video, score }
      })
      .filter((video) => {
        // Only include videos with positive music score
        return video.score > 0
      })
      .sort((a, b) => b.score - a.score) // Sort by music relevance score
      .map(({ score, ...video }) => video) // Remove score from final result
  }
}

// Create a singleton instance
export const createYouTubeAPI = (apiKey?: string) => new YouTubeAPI(apiKey)
