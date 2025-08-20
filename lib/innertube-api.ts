// Innertube API implementation for YouTube's internal API
// This provides access to YouTube data without quota limitations

interface InnertubeContext {
  client: {
    clientName: string
    clientVersion: string
    hl: string
    gl: string
    utcOffsetMinutes: number
  }
}

interface InnertubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: string
  viewCount: string
  publishedAt: string
}

interface InnertubeSearchResult {
  videos: InnertubeVideo[]
  nextPageToken?: string
}

export class InnertubeAPI {
  private baseUrl = "https://www.youtube.com/youtubei/v1"
  private apiKey = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8" // Public Innertube API key
  private context: InnertubeContext = {
    client: {
      clientName: "WEB",
      clientVersion: "2.20240101.00.00",
      hl: "en",
      gl: "US",
      utcOffsetMinutes: 0,
    },
  }

  async searchMusic(query: string, maxResults = 20): Promise<InnertubeSearchResult> {
    try {
      console.log(`[v0] 🎵 Innertube API: Searching for "${query}"`)

      const musicQuery = `${query} music OR song OR audio OR track OR official`
      const response = await fetch(`${this.baseUrl}/search?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          context: this.context,
          query: musicQuery,
          params: "EgIQAQ%3D%3D", // Filter for videos only
        }),
      })

      if (!response.ok) {
        throw new Error(`Innertube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const videos = this.parseSearchResults(data, maxResults)

      console.log(`[v0] 🎵 Innertube search returned ${videos.length} results for: ${query}`)

      return {
        videos,
        nextPageToken:
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
            ?.musicShelfRenderer?.continuations?.[0]?.nextContinuationData?.continuation,
      }
    } catch (error) {
      console.error("[v0] 🎵 Innertube search error:", error)
      throw error
    }
  }

  async getTrendingMusic(maxResults = 20): Promise<InnertubeVideo[]> {
    try {
      console.log(`[v0] 🎵 Innertube API: Fetching trending music`)

      const response = await fetch(`${this.baseUrl}/browse?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          context: this.context,
          browseId: "FEmusic_trending",
        }),
      })

      if (!response.ok) {
        throw new Error(`Innertube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const videos = this.parseTrendingResults(data, maxResults)

      console.log(`[v0] 🎵 Innertube trending returned ${videos.length} results`)
      return videos
    } catch (error) {
      console.error("[v0] 🎵 Innertube trending error:", error)
      throw error
    }
  }

  async getPlaylistVideos(playlistId: string, maxResults = 50): Promise<InnertubeVideo[]> {
    try {
      console.log(`[v0] 🎵 Innertube API: Fetching playlist ${playlistId}`)

      const response = await fetch(`${this.baseUrl}/browse?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          context: this.context,
          browseId: `VL${playlistId}`,
        }),
      })

      if (!response.ok) {
        throw new Error(`Innertube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const videos = this.parsePlaylistResults(data, maxResults)

      console.log(`[v0] 🎵 Innertube playlist returned ${videos.length} videos`)
      return videos
    } catch (error) {
      console.error("[v0] 🎵 Innertube playlist error:", error)
      throw error
    }
  }

  private parseSearchResults(data: any, maxResults: number): InnertubeVideo[] {
    try {
      const contents =
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || []
      const videos: InnertubeVideo[] = []

      for (const section of contents) {
        const items = section.videoRenderer ? [section] : section.itemSectionRenderer?.contents || []

        for (const item of items) {
          if (item.videoRenderer && videos.length < maxResults) {
            const video = item.videoRenderer
            const videoData = {
              id: video.videoId || "",
              title: video.title?.runs?.[0]?.text || video.title?.simpleText || "Unknown Title",
              channelTitle:
                video.ownerText?.runs?.[0]?.text || video.longBylineText?.runs?.[0]?.text || "Unknown Channel",
              thumbnail: video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url || "",
              duration: this.parseDuration(video.lengthText?.simpleText || "0:00"),
              viewCount: video.viewCountText?.simpleText?.replace(/[^\d]/g, "") || "0",
              publishedAt: video.publishedTimeText?.simpleText || new Date().toISOString(),
            }

            if (videoData.id) {
              videos.push(videoData)
            }
          }
        }
      }

      return this.filterMusicContent(videos)
    } catch (error) {
      console.error("[v0] 🎵 Error parsing Innertube search results:", error)
      return []
    }
  }

  private parseTrendingResults(data: any, maxResults: number): InnertubeVideo[] {
    try {
      const contents =
        data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
        []
      const videos: InnertubeVideo[] = []

      for (const section of contents) {
        const items =
          section.musicCarouselShelfRenderer?.contents ||
          section.musicShelfRenderer?.contents ||
          section.itemSectionRenderer?.contents ||
          []

        for (const item of items) {
          if (videos.length >= maxResults) break

          let videoData: InnertubeVideo | null = null

          // Handle different item types
          if (item.musicTwoRowItemRenderer) {
            const video = item.musicTwoRowItemRenderer
            videoData = {
              id: video.navigationEndpoint?.watchEndpoint?.videoId || "",
              title: video.title?.runs?.[0]?.text || "Unknown Title",
              channelTitle: video.subtitle?.runs?.[0]?.text || "Unknown Channel",
              thumbnail: video.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url || "",
              duration: "3:30", // Default duration for trending
              viewCount: "0",
              publishedAt: new Date().toISOString(),
            }
          } else if (item.videoRenderer) {
            const video = item.videoRenderer
            videoData = {
              id: video.videoId || "",
              title: video.title?.runs?.[0]?.text || video.title?.simpleText || "Unknown Title",
              channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown Channel",
              thumbnail: video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url || "",
              duration: this.parseDuration(video.lengthText?.simpleText || "3:30"),
              viewCount: video.viewCountText?.simpleText?.replace(/[^\d]/g, "") || "0",
              publishedAt: video.publishedTimeText?.simpleText || new Date().toISOString(),
            }
          }

          if (videoData && videoData.id) {
            videos.push(videoData)
          }
        }
      }

      return videos.filter((v) => v.id) // Filter out items without video IDs
    } catch (error) {
      console.error("[v0] 🎵 Error parsing Innertube trending results:", error)
      return []
    }
  }

  private parsePlaylistResults(data: any, maxResults: number): InnertubeVideo[] {
    try {
      const contents =
        data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
        []
      const videos: InnertubeVideo[] = []

      for (const section of contents) {
        const items = section.musicPlaylistShelfRenderer?.contents || []

        for (const item of items) {
          if (item.musicResponsiveListItemRenderer && videos.length < maxResults) {
            const video = item.musicResponsiveListItemRenderer
            const videoData = {
              id: video.playNavigationEndpoint?.watchEndpoint?.videoId || "",
              title:
                video.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ||
                "Unknown Title",
              channelTitle:
                video.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ||
                "Unknown Channel",
              thumbnail: video.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url || "",
              duration: video.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.simpleText || "3:30",
              viewCount: "0",
              publishedAt: new Date().toISOString(),
            }

            if (videoData.id) {
              videos.push(videoData)
            }
          }
        }
      }

      return videos
    } catch (error) {
      console.error("[v0] 🎵 Error parsing Innertube playlist results:", error)
      return []
    }
  }

  private parseDuration(durationText: string): string {
    if (!durationText) return "3:30"

    // If already in MM:SS or H:MM:SS format, return as is
    if (durationText.match(/^\d+:\d{2}(:\d{2})?$/)) {
      return durationText
    }

    // Handle other formats or default to 3:30
    return "3:30"
  }

  private filterMusicContent(videos: InnertubeVideo[]): InnertubeVideo[] {
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
      "behind the scenes",
      "making of",
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

        // Filter out obvious non-music content
        if (hasNonMusicKeywords && !hasMusicKeywords) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase()
        const bTitle = b.title.toLowerCase()
        const aChannel = a.channelTitle.toLowerCase()
        const bChannel = b.channelTitle.toLowerCase()

        // Prioritize official music content
        const aIsOfficial = aTitle.includes("official") || aChannel.includes("vevo") || aChannel.includes("records")
        const bIsOfficial = bTitle.includes("official") || bChannel.includes("vevo") || bChannel.includes("records")

        if (aIsOfficial && !bIsOfficial) return -1
        if (!aIsOfficial && bIsOfficial) return 1

        return 0
      })
  }
}

// Create a singleton instance
export const createInnertubeAPI = () => new InnertubeAPI()
