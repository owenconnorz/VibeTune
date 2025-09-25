interface YouTubeMusicBrowseSection {
  title: string
  contents: YouTubeMusicTrack[]
  browseId?: string
  continuationToken?: string
}

interface YouTubeMusicBrowseResult {
  sections: YouTubeMusicBrowseSection[]
  continuationToken?: string
  error?: string
}

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

class YouTubeMusicBrowse {
  private baseUrl = "https://music.youtube.com/youtubei/v1/browse"
  private apiKey = process.env.YOUTUBE_API_KEY || ""

  private clientConfig = {
    clientName: "WEB_REMIX",
    clientVersion: "1.20241210.01.00",
    hl: "en",
    gl: "US",
    utcOffsetMinutes: 0,
  }

  private async makeRequest(
    browseId: string,
    continuationToken?: string,
    accessToken?: string,
    ytmusicHeaders?: Record<string, string>,
  ): Promise<any> {
    const body = {
      context: {
        client: this.clientConfig,
        user: {
          lockedSafetyMode: false,
        },
      },
      browseId,
      ...(continuationToken && { continuation: continuationToken }),
    }

    console.log(`[v0] YouTube Music Browse: Enhanced request ${browseId} (authenticated: ${!!accessToken})`)

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
      "X-Goog-Visitor-Id": "CgtVc0JHVkVqVVBBSSiMjZq2BjIKCgJVUxIEGgAgOA%3D%3D",
      "X-Origin": "https://music.youtube.com",
      "X-Youtube-Client-Name": "67",
      "X-Youtube-Client-Version": "1.20241210.01.00",
    }

    // Add authentication headers if available
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`
      headers["X-Youtube-Bootstrap-Logged-In"] = "true"
    } else {
      headers["X-Youtube-Bootstrap-Logged-In"] = "false"
    }

    // Merge additional YouTube Music headers
    if (ytmusicHeaders) {
      Object.assign(headers, ytmusicHeaders)
    }

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}&prettyPrint=false`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`YouTube Music API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private parseTrackFromRenderer(renderer: any): YouTubeMusicTrack | null {
    try {
      // Handle different renderer types
      const musicResponsiveListItemRenderer = renderer.musicResponsiveListItemRenderer
      const musicTwoRowItemRenderer = renderer.musicTwoRowItemRenderer

      let trackData: any = null

      if (musicResponsiveListItemRenderer) {
        trackData = musicResponsiveListItemRenderer
      } else if (musicTwoRowItemRenderer) {
        trackData = musicTwoRowItemRenderer
      } else {
        return null
      }

      // Extract video ID
      const navigationEndpoint =
        trackData.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
          ?.playNavigationEndpoint ||
        trackData.navigationEndpoint ||
        trackData.doubleTapCommand

      const videoId = navigationEndpoint?.watchEndpoint?.videoId || navigationEndpoint?.videoId

      if (!videoId) return null

      // Extract title
      const titleRuns =
        trackData.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || trackData.title?.runs
      const title = titleRuns?.[0]?.text || "Unknown Title"

      // Extract artist
      const artistRuns =
        trackData.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || trackData.subtitle?.runs
      const artist =
        artistRuns?.find((run: any) => run.navigationEndpoint?.browseEndpoint)?.text ||
        artistRuns?.[0]?.text ||
        "Unknown Artist"

      // Extract thumbnail
      const thumbnails =
        trackData.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
        trackData.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails
      const thumbnail = thumbnails?.[thumbnails.length - 1]?.url || ""

      return {
        id: videoId,
        title: title.replace(/&amp;/g, "&").replace(/&quot;/g, '"'),
        artist: artist.replace(/&amp;/g, "&").replace(/&quot;/g, '"'),
        duration: 0, // Duration not always available in browse responses
        thumbnail: thumbnail.startsWith("//") ? `https:${thumbnail}` : thumbnail,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        source: "youtube-music" as const,
      }
    } catch (error) {
      console.warn("[v0] Failed to parse track from renderer:", error)
      return null
    }
  }

  private parseSectionFromRenderer(renderer: any): YouTubeMusicBrowseSection | null {
    try {
      const musicCarouselShelfRenderer = renderer.musicCarouselShelfRenderer
      const musicShelfRenderer = renderer.musicShelfRenderer

      let sectionData: any = null
      let contents: any[] = []

      if (musicCarouselShelfRenderer) {
        sectionData = musicCarouselShelfRenderer
        contents = sectionData.contents || []
      } else if (musicShelfRenderer) {
        sectionData = musicShelfRenderer
        contents = sectionData.contents || []
      } else {
        return null
      }

      const title =
        sectionData.title?.runs?.[0]?.text ||
        sectionData.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text ||
        "Unknown Section"

      const tracks: YouTubeMusicTrack[] = contents
        .map((item: any) => this.parseTrackFromRenderer(item))
        .filter((track): track is YouTubeMusicTrack => track !== null)

      if (tracks.length === 0) return null

      return {
        title: title.replace(/&amp;/g, "&").replace(/&quot;/g, '"'),
        contents: tracks,
        browseId: sectionData.browseId,
        continuationToken: sectionData.continuationToken,
      }
    } catch (error) {
      console.warn("[v0] Failed to parse section from renderer:", error)
      return null
    }
  }

  async getHomeFeed(accessToken?: string, ytmusicHeaders?: Record<string, string>): Promise<YouTubeMusicBrowseResult> {
    try {
      console.log(`[v0] YouTube Music Browse: Getting enhanced home feed (authenticated: ${!!accessToken})`)

      // Use the home browse ID for YouTube Music
      const data = await this.makeRequest("FEmusic_home", undefined, accessToken, ytmusicHeaders)

      const sections: YouTubeMusicBrowseSection[] = []

      // Parse sections from the response
      const sectionListRenderer =
        data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
      const sectionContents = sectionListRenderer?.contents || []

      for (const sectionContent of sectionContents) {
        const section = this.parseSectionFromRenderer(sectionContent)
        if (section && section.contents.length > 0) {
          sections.push(section)
        }
      }

      console.log(`[v0] YouTube Music Browse: Found ${sections.length} enhanced sections with content`)

      return {
        sections,
        continuationToken: sectionListRenderer?.continuations?.[0]?.nextContinuationData?.continuation,
      }
    } catch (error) {
      console.error("[v0] YouTube Music Browse enhanced home feed error:", error)
      return {
        sections: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getQuickPicks(accessToken?: string, ytmusicHeaders?: Record<string, string>): Promise<YouTubeMusicTrack[]> {
    try {
      const homeData = await this.getHomeFeed(accessToken, ytmusicHeaders)

      // Look for quick picks or mixed sections
      const quickPicksSection = homeData.sections.find(
        (section) =>
          section.title.toLowerCase().includes("quick") ||
          section.title.toLowerCase().includes("mixed") ||
          section.title.toLowerCase().includes("for you"),
      )

      return quickPicksSection?.contents.slice(0, 8) || []
    } catch (error) {
      console.error("[v0] YouTube Music Browse enhanced quick picks error:", error)
      return []
    }
  }

  async getNewReleases(accessToken?: string, ytmusicHeaders?: Record<string, string>): Promise<YouTubeMusicTrack[]> {
    try {
      const homeData = await this.getHomeFeed(accessToken, ytmusicHeaders)

      // Look for new releases section
      const newReleasesSection = homeData.sections.find(
        (section) =>
          section.title.toLowerCase().includes("new") ||
          section.title.toLowerCase().includes("release") ||
          section.title.toLowerCase().includes("latest"),
      )

      return newReleasesSection?.contents.slice(0, 12) || []
    } catch (error) {
      console.error("[v0] YouTube Music Browse enhanced new releases error:", error)
      return []
    }
  }

  async getRecommendations(
    accessToken?: string,
    ytmusicHeaders?: Record<string, string>,
  ): Promise<YouTubeMusicTrack[]> {
    try {
      const homeData = await this.getHomeFeed(accessToken, ytmusicHeaders)

      // Look for recommendation sections
      const recommendationSection = homeData.sections.find(
        (section) =>
          section.title.toLowerCase().includes("recommend") ||
          section.title.toLowerCase().includes("discover") ||
          section.title.toLowerCase().includes("listen again"),
      )

      return recommendationSection?.contents.slice(0, 15) || []
    } catch (error) {
      console.error("[v0] YouTube Music Browse enhanced recommendations error:", error)
      return []
    }
  }
}

export const youtubeMusicBrowse = new YouTubeMusicBrowse()
export type { YouTubeMusicBrowseResult, YouTubeMusicBrowseSection, YouTubeMusicTrack }
