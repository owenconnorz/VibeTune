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

export class YouTubeAPI {
  private baseUrl = "https://www.googleapis.com/youtube/v3"
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || "AIzaSyBIQVGnXO2T7smsxf6q_MWxMD1sQzek1Nc"
  }

  async searchMusic(query: string, maxResults = 20): Promise<YouTubeSearchResult> {
    try {
      const url = new URL(`${this.baseUrl}/search`)
      url.searchParams.set("part", "snippet")
      url.searchParams.set("q", query)
      url.searchParams.set("type", "video")
      url.searchParams.set("maxResults", Math.min(maxResults, 25).toString())
      url.searchParams.set("order", "relevance")
      url.searchParams.set("videoDuration", "medium")
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "OpenTune/1.0",
        },
      })

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status} ${response.statusText}`)
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      const videos = this.parseSearchResults(data.items || [])

      return {
        videos: this.filterMusicContent(videos),
        nextPageToken: data.nextPageToken,
      }
    } catch (error) {
      console.error(`Search error:`, error)
      throw error
    }
  }

  async getTrendingMusic(maxResults = 20): Promise<YouTubeVideo[]> {
    try {
      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set("part", "snippet,statistics,contentDetails")
      url.searchParams.set("chart", "mostPopular")
      url.searchParams.set("videoCategoryId", "10") // Music category
      url.searchParams.set("regionCode", "US")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "OpenTune/1.0",
        },
      })

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status} ${response.statusText}`)
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      const videos = this.parseTrendingResults(data.items || [])

      return videos
    } catch (error) {
      console.error(`Trending error:`, error)
      throw error
    }
  }

  async getPlaylistVideos(playlistId: string, maxResults = 50): Promise<YouTubeVideo[]> {
    try {
      const url = new URL(`${this.baseUrl}/playlistItems`)
      url.searchParams.set("part", "snippet")
      url.searchParams.set("playlistId", playlistId)
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "OpenTune/1.0",
        },
      })

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status} ${response.statusText}`)
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      const videos = this.parsePlaylistResults(data.items || [])

      return videos
    } catch (error) {
      console.error(`Playlist error:`, error)
      throw error
    }
  }

  async getUserPlaylists(accessToken: string, maxResults = 25): Promise<YouTubePlaylist[]> {
    try {
      const url = new URL(`${this.baseUrl}/playlists`)
      url.searchParams.set("part", "snippet,contentDetails")
      url.searchParams.set("mine", "true")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "OpenTune/1.0",
        },
      })

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status} ${response.statusText}`)
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      const playlists = this.parsePlaylistsResults(data.items || [])

      return playlists
    } catch (error) {
      console.error(`User playlists error:`, error)
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

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "OpenTune/1.0",
        },
      })

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status} ${response.statusText}`)
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      const videos = this.parseTrendingResults(data.items || [])

      return videos
    } catch (error) {
      console.error(`Liked videos error:`, error)
      throw error
    }
  }

  private parseSearchResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.id?.videoId || item.id,
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      duration: "3:30", // Duration not available in search results
      viewCount: "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parseTrendingResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.id,
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
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
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
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
      "vevo",
      "records",
    ]

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
    ]

    return videos
      .filter((video) => {
        const title = video.title.toLowerCase()
        const channelTitle = video.channelTitle.toLowerCase()

        const hasMusicKeywords = musicKeywords.some(
          (keyword) => title.includes(keyword) || channelTitle.includes(keyword),
        )
        const hasNonMusicKeywords = nonMusicKeywords.some((keyword) => title.includes(keyword))

        // Include VEVO channels and official content
        if (channelTitle.includes("vevo") || title.includes("official")) {
          return true
        }

        // Filter out non-music content
        if (hasNonMusicKeywords && !hasMusicKeywords) {
          return false
        }

        return hasMusicKeywords
      })
      .sort((a, b) => {
        const aChannel = a.channelTitle.toLowerCase()
        const bChannel = b.channelTitle.toLowerCase()
        const aTitle = a.title.toLowerCase()
        const bTitle = b.title.toLowerCase()

        // Prioritize VEVO channels
        if (aChannel.includes("vevo") && !bChannel.includes("vevo")) return -1
        if (!aChannel.includes("vevo") && bChannel.includes("vevo")) return 1

        // Prioritize official content
        if (aTitle.includes("official") && !bTitle.includes("official")) return -1
        if (!aTitle.includes("official") && bTitle.includes("official")) return 1

        return 0
      })
  }
}

// Create a singleton instance
export const createYouTubeAPI = (apiKey?: string) => new YouTubeAPI(apiKey)
