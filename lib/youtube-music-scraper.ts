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

interface YouTubeMusicSearchOptions {
  type?: "all" | "songs" | "videos" | "albums" | "playlists" | "artists"
  useAuth?: boolean
  fallbackToOldAPI?: boolean
  accessToken?: string
}

class YouTubeMusicScraper {
  private baseUrl = "https://music.youtube.com"
  private apiKey = process.env.YOUTUBE_API_KEY || ""

  async search(
    query: string,
    page = 1,
    limit = 20,
    options: YouTubeMusicSearchOptions = {},
  ): Promise<YouTubeMusicSearchResult> {
    try {
      console.log("[v0] YouTube Music Scraper: Enhanced search for:", query, options)

      const searchUrl = "https://music.youtube.com/youtubei/v1/search"

      const context = options.accessToken ? this.getAuthenticatedContext(options.accessToken) : this.getDefaultContext()

      const body = {
        context,
        query,
        params: this.getSearchParams(options.type || "all"),
      }

      const headers = this.getRequestHeaders(options.accessToken)

      const response = await fetch(`${searchUrl}?key=${this.apiKey}&prettyPrint=false`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        if (options.fallbackToOldAPI !== false) {
          console.log("[v0] YouTube Music Scraper: Falling back to basic search")
          return this.fallbackSearch(query, limit)
        }
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      const tracks = this.parseSearchResults(data)

      console.log(`[v0] YouTube Music Scraper: Found ${tracks.length} tracks`)

      return {
        tracks: tracks.slice((page - 1) * limit, page * limit),
        totalCount: tracks.length,
        hasNextPage: tracks.length > page * limit,
      }
    } catch (error) {
      console.error("[v0] YouTube Music Scraper enhanced search error:", error)

      if (options.fallbackToOldAPI !== false) {
        return this.fallbackSearch(query, limit)
      }

      return {
        tracks: [],
        totalCount: 0,
        hasNextPage: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private getAuthenticatedContext(accessToken: string) {
    return {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: "1.20241210.01.00",
        hl: "en",
        gl: "US",
        visitorData: this.generateVisitorData(),
      },
      user: {
        lockedSafetyMode: false,
        onBehalfOfUser: accessToken.substring(0, 16),
      },
      request: {
        useSsl: true,
        internalExperimentFlags: [],
      },
    }
  }

  private getDefaultContext() {
    return {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: "1.20241210.01.00",
        hl: "en",
        gl: "US",
        visitorData: this.generateVisitorData(),
      },
      user: {
        lockedSafetyMode: false,
      },
    }
  }

  private parseTrackFromRenderer(renderer: any): YouTubeMusicTrack | null {
    try {
      const musicResponsiveListItemRenderer = renderer.musicResponsiveListItemRenderer
      if (!musicResponsiveListItemRenderer) return null

      // Extract video ID
      const navigationEndpoint =
        musicResponsiveListItemRenderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
          ?.playNavigationEndpoint
      const videoId = navigationEndpoint?.watchEndpoint?.videoId
      if (!videoId) return null

      // Extract title
      const titleRuns =
        musicResponsiveListItemRenderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
      const title = titleRuns?.[0]?.text || "Unknown Title"

      // Extract artist
      const artistRuns =
        musicResponsiveListItemRenderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
      const artist =
        artistRuns?.find((run: any) => run.navigationEndpoint?.browseEndpoint)?.text ||
        artistRuns?.[0]?.text ||
        "Unknown Artist"

      // Extract thumbnail
      const thumbnails = musicResponsiveListItemRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails
      const thumbnail = thumbnails?.[thumbnails.length - 1]?.url || ""

      return {
        id: videoId,
        title: title.replace(/&/g, "&").replace(/"/g, '"'),
        artist: artist.replace(/&/g, "&").replace(/"/g, '"'),
        duration: 0,
        thumbnail: thumbnail.startsWith("//") ? `https:${thumbnail}` : thumbnail,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        source: "youtube-music" as const,
      }
    } catch (error) {
      console.warn("[v0] Failed to parse track from renderer:", error)
      return null
    }
  }

  private getRequestHeaders(accessToken?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Origin: "https://music.youtube.com",
      Referer: "https://music.youtube.com/",
      "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "same-origin",
      "Sec-Fetch-Site": "same-origin",
      "X-Goog-AuthUser": "0",
      "X-Goog-Visitor-Id": this.generateVisitorData(),
      "X-Origin": "https://music.youtube.com",
      "X-Youtube-Bootstrap-Logged-In": accessToken ? "true" : "false",
      "X-Youtube-Client-Name": "67",
      "X-Youtube-Client-Version": "1.20241210.01.00",
    }

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`
      headers["Cookie"] = `SAPISID=${accessToken.substring(0, 32)}; HSID=${accessToken.substring(32, 64)}`
    }

    return headers
  }

  private getSearchParams(type: string): string {
    const params = {
      all: "EgWKAQIIAWoKEAoQAxAEEAkQBQ%3D%3D",
      songs: "EgWKAQIIAWoKEAoQAxAEEAkQBQ%3D%3D",
      videos: "EgWKAQIQAWoKEAoQAxAEEAkQBQ%3D%3D",
      albums: "EgWKAQIYAWoKEAoQAxAEEAkQBQ%3D%3D",
      playlists: "EgWKAQIoAWoKEAoQAxAEEAkQBQ%3D%3D",
      artists: "EgWKAQIgAWoKEAoQAxAEEAkQBQ%3D%3D",
    }
    return params[type as keyof typeof params] || params.all
  }

  private generateVisitorData(): string {
    // Generate a visitor ID similar to YouTube's format
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    let result = ""
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private parseSearchResults(data: any): YouTubeMusicTrack[] {
    const tracks: YouTubeMusicTrack[] = []

    try {
      const contents =
        data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || []

      for (const section of contents) {
        const musicShelfRenderer = section.musicShelfRenderer
        if (musicShelfRenderer?.contents) {
          for (const item of musicShelfRenderer.contents) {
            const track = this.parseTrackFromRenderer(item)
            if (track) tracks.push(track)
          }
        }

        // Also check for carousel sections
        const musicCarouselShelfRenderer = section.musicCarouselShelfRenderer
        if (musicCarouselShelfRenderer?.contents) {
          for (const item of musicCarouselShelfRenderer.contents) {
            const track = this.parseTrackFromRenderer(item)
            if (track) tracks.push(track)
          }
        }
      }
    } catch (error) {
      console.warn("[v0] Error parsing search results:", error)
    }

    return tracks
  }

  private parseTrackFromRenderer(renderer: any): YouTubeMusicTrack | null {
    try {
      const musicResponsiveListItemRenderer = renderer.musicResponsiveListItemRenderer
      if (!musicResponsiveListItemRenderer) return null

      // Extract video ID
      const navigationEndpoint =
        musicResponsiveListItemRenderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
          ?.playNavigationEndpoint
      const videoId = navigationEndpoint?.watchEndpoint?.videoId
      if (!videoId) return null

      // Extract title
      const titleRuns =
        musicResponsiveListItemRenderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
      const title = titleRuns?.[0]?.text || "Unknown Title"

      // Extract artist
      const artistRuns =
        musicResponsiveListItemRenderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
      const artist =
        artistRuns?.find((run: any) => run.navigationEndpoint?.browseEndpoint)?.text ||
        artistRuns?.[0]?.text ||
        "Unknown Artist"

      // Extract thumbnail
      const thumbnails = musicResponsiveListItemRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails
      const thumbnail = thumbnails?.[thumbnails.length - 1]?.url || ""

      return {
        id: videoId,
        title: title.replace(/&/g, "&").replace(/"/g, '"'),
        artist: artist.replace(/&/g, "&").replace(/"/g, '"'),
        duration: 0,
        thumbnail: thumbnail.startsWith("//") ? `https:${thumbnail}` : thumbnail,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        source: "youtube-music" as const,
      }
    } catch (error) {
      console.warn("[v0] Failed to parse track from renderer:", error)
      return null
    }
  }

  private async fallbackSearch(query: string, limit: number): Promise<YouTubeMusicSearchResult> {
    try {
      console.log("[v0] YouTube Music Scraper: Using fallback search")

      // Use the existing basic search as fallback
      const searchUrl = "https://music.youtube.com/youtubei/v1/search"

      const body = {
        context: this.getDefaultContext(),
        query,
        params: "EgWKAQIIAWoKEAoQAxAEEAkQBQ%3D%3D",
      }

      const response = await fetch(`${searchUrl}?key=${this.apiKey}&prettyPrint=false`, {
        method: "POST",
        headers: this.getRequestHeaders(),
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Fallback search failed: ${response.status}`)
      }

      const data = await response.json()
      const tracks = this.parseSearchResults(data)

      return {
        tracks: tracks.slice(0, limit),
        totalCount: tracks.length,
        hasNextPage: false,
      }
    } catch (error) {
      console.error("[v0] Fallback search error:", error)
      return {
        tracks: [],
        totalCount: 0,
        hasNextPage: false,
        error: error instanceof Error ? error.message : "Search failed",
      }
    }
  }

  async getTrending(limit = 20): Promise<YouTubeMusicSearchResult> {
    try {
      console.log("[v0] YouTube Music Scraper: Getting trending music")

      const browseUrl = "https://music.youtube.com/youtubei/v1/browse"

      const body = {
        context: this.getDefaultContext(),
        browseId: "FEmusic_trending",
      }

      const response = await fetch(`${browseUrl}?key=${this.apiKey}&prettyPrint=false`, {
        method: "POST",
        headers: this.getRequestHeaders(),
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()

      const tracks: YouTubeMusicTrack[] = []
      const contents =
        data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
          ?.contents || []

      for (const section of contents) {
        const musicShelfRenderer = section.musicShelfRenderer
        if (musicShelfRenderer?.contents) {
          for (const item of musicShelfRenderer.contents) {
            const track = this.parseTrackFromRenderer(item)
            if (track) tracks.push(track)
          }
        }
      }

      console.log(`[v0] YouTube Music Scraper: Found ${tracks.length} trending tracks`)

      return {
        tracks: tracks.slice(0, limit),
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
export type { YouTubeMusicTrack, YouTubeMusicSearchResult, YouTubeMusicSearchOptions }
