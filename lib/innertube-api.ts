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
      clientName: "ANDROID",
      clientVersion: "19.09.37",
      androidSdkVersion: 30,
      hl: "en",
      gl: "US",
      utcOffsetMinutes: 0,
    },
    user: {
      lockedSafetyMode: false,
    },
  }

  constructor() {
    console.log("[v0] Innertube API initialized with ANDROID client")
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
          "X-YouTube-Client-Name": "3",
          "X-YouTube-Client-Version": "19.09.37",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          Origin: "https://www.youtube.com",
        },
        body: JSON.stringify({
          context: this.context,
          ...data,
        }),
      })

      console.log("[v0] Innertube API response status:", response.status)
      console.log("[v0] Innertube API response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Innertube API error response:", errorText)
        throw new Error(`Innertube API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log("[v0] Innertube API response structure:", {
        hasContents: !!result.contents,
        hasMetadata: !!result.metadata,
        keys: Object.keys(result),
      })
      return result
    } catch (error) {
      console.error("[v0] Innertube API request failed:", error)
      throw error
    }
  }

  async searchMusic(query: string, maxResults = 10): Promise<InnertubeSearchResult> {
    console.log("[v0] Innertube API searchMusic called with query:", query, "maxResults:", maxResults)

    if (!query.trim()) {
      console.log("[v0] Empty query provided, returning empty results")
      return { videos: [], nextPageToken: undefined }
    }

    try {
      console.log("[v0] Attempting Innertube API call for query:", query)

      const data = await this.makeRequest("search", {
        query: query,
        params: "EgWKAQIIAWoKEAoQAxAEEAkQBQ%3D%3D", // Music search filter
      })

      console.log("[v0] Innertube API success - processing results for query:", query)
      console.log("[v0] Raw API response structure:", JSON.stringify(data, null, 2).substring(0, 1000))

      const searchResults =
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
        data?.contents?.sectionListRenderer?.contents ||
        data?.contents?.richGridRenderer?.contents ||
        []

      console.log("[v0] Found search sections:", searchResults.length)

      const videos = this.parseSearchResults(searchResults)

      console.log("[v0] Successfully processed", videos.length, "videos for query:", query)
      return {
        videos: videos.slice(0, maxResults),
        nextPageToken: data?.nextPageToken,
      }
    } catch (error) {
      console.log("[v0] Innertube API error for query:", query, "Error:", error)
      console.log("[v0] Falling back to category-specific results")
      return this.getFallbackResults(query, maxResults)
    }
  }

  async getTrendingMusic(maxResults = 20): Promise<InnertubeVideo[]> {
    console.log("[v0] Starting getTrendingMusic with Innertube")

    try {
      const endpoints = [
        { browseId: "FEmusic_trending", params: "" },
        { browseId: "FEtrending", params: "4gINGgt5dG1hX2NoYXJ0cw%3D%3D" },
        { browseId: "FEmusic_home", params: "" },
      ]

      for (const endpoint of endpoints) {
        try {
          console.log("[v0] Trying trending endpoint:", endpoint.browseId)

          const data = await this.makeRequest("browse", endpoint)
          console.log("[v0] Trending API response structure:", {
            hasContents: !!data.contents,
            keys: Object.keys(data),
          })

          const videos = this.parseTrendingResults(data)

          if (videos.length > 0) {
            console.log("[v0] Successfully got", videos.length, "trending videos from", endpoint.browseId)
            return videos.slice(0, maxResults)
          }
        } catch (endpointError) {
          console.log("[v0] Endpoint", endpoint.browseId, "failed:", endpointError.message)
          continue
        }
      }

      throw new Error("All trending endpoints failed")
    } catch (error) {
      console.error("[v0] Innertube trending API error:", error)
      console.log("[v0] Returning fallback trending data")
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

  private parseSearchResults(sections: any[]): InnertubeVideo[] {
    const videos: InnertubeVideo[] = []

    console.log("[v0] Parsing search results from", sections.length, "sections")

    for (const section of sections) {
      const items =
        section?.itemSectionRenderer?.contents || section?.musicShelfRenderer?.contents || section?.videoRenderer
          ? [section]
          : []

      console.log("[v0] Processing section with", items.length, "items")

      for (const item of items) {
        if (item.videoRenderer) {
          const video = item.videoRenderer
          videos.push({
            id: video.videoId || "",
            title: video.title?.runs?.[0]?.text || video.title?.simpleText || "Unknown Title",
            channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown Channel",
            thumbnail: this.extractThumbnail(video.thumbnail),
            duration: this.formatDuration(video.lengthText?.simpleText || video.lengthText?.runs?.[0]?.text),
            viewCount: video.viewCountText?.simpleText || "0",
            publishedAt: new Date().toISOString(),
          })
        }
      }
    }

    console.log("[v0] Parsed", videos.length, "search result videos")
    return videos
  }

  private parseTrendingResults(data: any): InnertubeVideo[] {
    const videos: InnertubeVideo[] = []

    const contentPaths = [
      data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents,
      data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents,
      data?.contents?.sectionListRenderer?.contents,
      data?.contents?.richGridRenderer?.contents,
    ]

    for (const contents of contentPaths) {
      if (!contents) continue

      console.log("[v0] Processing content path with", contents.length, "sections")

      for (const section of contents) {
        const items =
          section?.itemSectionRenderer?.contents ||
          section?.musicCarouselShelfRenderer?.contents ||
          section?.richItemRenderer?.content ||
          []

        for (const item of items) {
          if (item.videoRenderer) {
            const video = item.videoRenderer
            videos.push({
              id: video.videoId || "",
              title: video.title?.runs?.[0]?.text || video.title?.simpleText || "Unknown Title",
              channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown Channel",
              thumbnail: this.extractThumbnail(video.thumbnail),
              duration: this.formatDuration(video.lengthText?.simpleText || video.lengthText?.runs?.[0]?.text),
              viewCount: video.viewCountText?.simpleText || "0",
              publishedAt: new Date().toISOString(),
            })
          }
        }
      }

      if (videos.length > 0) break
    }

    console.log("[v0] Parsed", videos.length, "trending videos")
    return videos
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
          duration: this.formatDuration(video.lengthText?.simpleText),
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
