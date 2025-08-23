// Innertube API utility functions for fetching music data using YouTube's internal API

export interface InnertubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: string
  viewCount: string
  publishedAt: string
  type?: "song" | "artist" | "album" | "playlist"
  isArtistChannel?: boolean
  isAlbumPlaylist?: boolean
}

export interface InnertubeArtist {
  id: string
  name: string
  thumbnail: string
  subscriberCount?: string
  description?: string
  type: "artist"
}

export interface InnertubeAlbum {
  id: string
  title: string
  artist: string
  thumbnail: string
  videoCount: number
  publishedAt: string
  type: "album"
}

export interface EnhancedSearchResult {
  songs: InnertubeVideo[]
  artists: InnertubeArtist[]
  albums: InnertubeAlbum[]
  playlists: InnertubePlaylist[]
  nextPageToken?: string
}

export interface InnertubePlaylist {
  id: string
  title: string
  description: string
  thumbnail: string
  videoCount: number
  privacy: string
  publishedAt: string
}

export interface InnertubeSearchResult {
  videos: InnertubeVideo[]
  nextPageToken?: string
}

export interface SearchSuggestion {
  text: string
  boldText?: string[]
}

export interface MediaInfo {
  videoId: string
  title?: string
  author?: string
  authorId?: string
  authorThumbnail?: string
  description?: string
  subscribers?: string
  uploadDate?: string
  viewCount?: number
  like?: number
  dislike?: number
}

const FALLBACK_TRENDING_SONGS: InnertubeVideo[] = [
  {
    id: "3tmd-ClpJxA",
    title: "Blinding Lights",
    channelTitle: "The Weeknd",
    thumbnail: "/placeholder.svg?height=300&width=300",
    duration: "3:20",
    viewCount: "1000000",
    publishedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "kTJczUoc26U",
    title: "Watermelon Sugar",
    channelTitle: "Harry Styles",
    thumbnail: "/placeholder.svg?height=300&width=300",
    duration: "2:54",
    viewCount: "800000",
    publishedAt: "2023-01-02T00:00:00Z",
  },
  {
    id: "YQHsXMglC9A",
    title: "Hello",
    channelTitle: "Adele",
    thumbnail: "/placeholder.svg?height=300&width=300",
    duration: "4:55",
    viewCount: "1200000",
    publishedAt: "2023-01-03T00:00:00Z",
  },
]

export class InnertubeAPI {
  private baseUrl = "https://www.youtube.com/youtubei/v1"
  private context = {
    client: {
      clientName: "WEB_REMIX",
      clientVersion: "1.20240918.01.00",
      hl: "en",
      gl: "US",
      utcOffsetMinutes: 0,
    },
    user: {
      lockedSafetyMode: false,
    },
  }

  private visitorData?: string
  private dataSyncId?: string
  private cookie?: string
  private cookieMap: Record<string, string> = {}

  constructor() {
    console.log("[v0] Simplified Innertube API initialized")
  }

  setCookie(cookie: string) {
    this.cookie = cookie
    this.cookieMap = this.parseCookieString(cookie)
    console.log("[v0] Cookie set for authentication")
  }

  private parseCookieString(cookie: string): Record<string, string> {
    const cookies: Record<string, string> = {}
    cookie.split(";").forEach((c) => {
      const [key, value] = c.trim().split("=")
      if (key && value) cookies[key] = value
    })
    return cookies
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      console.log(`[v0] Making request to ${endpoint} with data:`, JSON.stringify(data, null, 2))

      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
          "X-YouTube-Client-Name": "67",
          "X-YouTube-Client-Version": "1.20240918.01.00",
          Origin: "https://music.youtube.com",
          Referer: "https://music.youtube.com/",
        },
        body: JSON.stringify({
          context: this.context,
          ...data,
        }),
      })

      console.log(`[v0] Response status for ${endpoint}:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] API error for ${endpoint}:`, errorText)
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      console.log(`[v0] Success for ${endpoint}, response keys:`, Object.keys(result))
      return result
    } catch (error) {
      console.error(`[v0] Request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async searchMusic(query: string, maxResults = 10): Promise<InnertubeSearchResult> {
    console.log("[v0] Starting searchMusic for:", query)

    if (!query.trim()) {
      return { videos: [], nextPageToken: undefined }
    }

    try {
      const data = await this.makeRequest("search", {
        query: query,
        params: "EgWKAQIIAWoKEAoQAxAEEAkQBQ%3D%3D", // Music search filter
      })

      const contents =
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || []
      console.log("[v0] Found search contents:", contents.length)

      const videos: InnertubeVideo[] = []

      for (const section of contents) {
        const items = section?.itemSectionRenderer?.contents || []
        for (const item of items) {
          if (item.videoRenderer) {
            const video = item.videoRenderer
            videos.push({
              id: video.videoId || "",
              title: video.title?.runs?.[0]?.text || "Unknown Title",
              channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown Channel",
              thumbnail: this.extractThumbnail(video.thumbnail),
              duration: video.lengthText?.simpleText || "3:30",
              viewCount: video.viewCountText?.simpleText || "0",
              publishedAt: new Date().toISOString(),
            })
          }
        }
      }

      console.log("[v0] Parsed", videos.length, "videos from search")
      return {
        videos: videos.slice(0, maxResults),
        nextPageToken: data?.nextPageToken,
      }
    } catch (error) {
      console.error("[v0] Search failed, using fallback:", error)
      return this.getFallbackResults(query, maxResults)
    }
  }

  async getTrendingMusic(maxResults = 20): Promise<InnertubeVideo[]> {
    console.log("[v0] Getting trending music")

    try {
      const data = await this.makeRequest("browse", {
        browseId: "FEmusic_trending",
      })

      const contents =
        data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
          ?.contents || []
      console.log("[v0] Found trending contents:", contents.length)

      const videos: InnertubeVideo[] = []

      for (const section of contents) {
        const items = section?.musicCarouselShelfRenderer?.contents || section?.itemSectionRenderer?.contents || []
        for (const item of items) {
          if (item.videoRenderer) {
            const video = item.videoRenderer
            videos.push({
              id: video.videoId || "",
              title: video.title?.runs?.[0]?.text || "Unknown Title",
              channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown Channel",
              thumbnail: this.extractThumbnail(video.thumbnail),
              duration: video.lengthText?.simpleText || "3:30",
              viewCount: video.viewCountText?.simpleText || "0",
              publishedAt: new Date().toISOString(),
            })
          }
        }
      }

      console.log("[v0] Parsed", videos.length, "trending videos")
      return videos.length > 0 ? videos.slice(0, maxResults) : FALLBACK_TRENDING_SONGS.slice(0, maxResults)
    } catch (error) {
      console.error("[v0] Trending failed, using fallback:", error)
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
    }
  }

  async getPlaylistDetails(playlistId: string): Promise<{ playlist: InnertubePlaylist; videos: InnertubeVideo[] }> {
    console.log("[v0] Starting getPlaylistDetails for playlistId:", playlistId)

    try {
      const data = await this.makeRequest("browse", {
        browseId: `VL${playlistId}`,
      })

      console.log("[v0] Innertube playlist API success")

      const playlistInfo =
        data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
          ?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer

      const playlist: InnertubePlaylist = {
        id: playlistId,
        title: data?.metadata?.playlistMetadataRenderer?.title || "Unknown Playlist",
        description: data?.metadata?.playlistMetadataRenderer?.description || "",
        thumbnail: this.extractThumbnail(data?.microformat?.microformatDataRenderer?.thumbnail),
        videoCount: playlistInfo?.contents?.length || 0,
        privacy: "public",
        publishedAt: new Date().toISOString(),
      }

      const videos = this.parsePlaylistResults(playlistInfo?.contents || [])

      return { playlist, videos }
    } catch (error) {
      console.error("[v0] Innertube playlist API error:", error)
      return {
        playlist: {
          id: playlistId,
          title: "Sample Playlist",
          description: "A sample playlist",
          thumbnail: "/placeholder.svg?height=300&width=300",
          videoCount: 10,
          privacy: "public",
          publishedAt: new Date().toISOString(),
        },
        videos: FALLBACK_TRENDING_SONGS.slice(0, 10),
      }
    }
  }

  private parsePlaylistResults(items: any[]): InnertubeVideo[] {
    return items
      .filter((item) => item.playlistVideoRenderer)
      .map((item) => {
        const video = item.playlistVideoRenderer
        return {
          id: video.videoId || "",
          title: video.title?.runs?.[0]?.text || video.title?.simpleText || "Unknown Title",
          channelTitle: video.shortBylineText?.runs?.[0]?.text || "Unknown Channel",
          thumbnail: this.extractThumbnail(video.thumbnail),
          duration: video.lengthText?.simpleText,
          viewCount: "0",
          publishedAt: new Date().toISOString(),
        }
      })
  }

  private extractThumbnail(thumbnailData: any): string {
    console.log("[v0] Extracting thumbnail from data:", thumbnailData)

    if (!thumbnailData?.thumbnails) {
      console.log("[v0] No thumbnail data available, using placeholder")
      return "/placeholder.svg?height=300&width=300"
    }

    const thumbnails = thumbnailData.thumbnails
    console.log("[v0] Available thumbnails:", thumbnails.length)

    const sortedThumbnails = thumbnails.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))

    const highRes =
      sortedThumbnails.find((t: any) => t.width >= 720) ||
      sortedThumbnails.find((t: any) => t.width >= 480) ||
      sortedThumbnails.find((t: any) => t.width >= 320) ||
      sortedThumbnails[0]

    if (!highRes?.url) {
      console.log("[v0] No valid thumbnail URL found, using placeholder")
      return "/placeholder.svg?height=300&width=300"
    }

    const thumbnailUrl = highRes.url.startsWith("//") ? `https:${highRes.url}` : highRes.url
    console.log("[v0] Selected thumbnail:", thumbnailUrl, "Resolution:", highRes.width + "x" + highRes.height)

    return thumbnailUrl
  }

  private formatDuration(durationText: string): string {
    if (!durationText) return "3:30"

    return durationText
  }

  private getFallbackResults(query: string, maxResults: number): InnertubeSearchResult {
    const queryLower = query.toLowerCase()
    const filtered = FALLBACK_TRENDING_SONGS.filter(
      (song) => song.title.toLowerCase().includes(queryLower) || song.channelTitle.toLowerCase().includes(queryLower),
    )

    return {
      videos: filtered.slice(0, maxResults),
      nextPageToken: undefined,
    }
  }
}

export function createInnertubeAPI(): InnertubeAPI {
  return new InnertubeAPI()
}

export async function searchMusic(query: string, maxResults = 10): Promise<InnertubeSearchResult> {
  const api = createInnertubeAPI()
  return api.searchMusic(query, maxResults)
}

export async function fetchTrending(maxResults = 20): Promise<InnertubeVideo[]> {
  const api = createInnertubeAPI()
  return api.getTrendingMusic(maxResults)
}
