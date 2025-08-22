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
      clientName: "WEB",
      clientVersion: "2.20231201.01.00",
      hl: "en",
      gl: "US",
      utcOffsetMinutes: 0,
    },
    user: {
      lockedSafetyMode: false,
    },
  }

  constructor() {
    console.log("[v0] Innertube API initialized")
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          context: this.context,
          ...data,
        }),
      })

      if (!response.ok) {
        throw new Error(`Innertube API error: ${response.status}`)
      }

      return await response.json()
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
        params: "EgIQAQ%3D%3D", // Filter for videos only
      })

      console.log("[v0] Innertube API success - processing results for query:", query)

      const videos = this.parseSearchResults(
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
          ?.itemSectionRenderer?.contents || [],
      )

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
      const data = await this.makeRequest("browse", {
        browseId: "FEtrending",
        params: "4gINGgt5dG1hX2NoYXJ0cw%3D%3D", // Music trending
      })

      console.log("[v0] Innertube trending API success")

      const videos = this.parseTrendingResults(
        data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
          ?.contents || [],
      )

      console.log("[v0] Successfully processed", videos.length, "trending videos")
      return videos.slice(0, maxResults)
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

  private parseSearchResults(items: any[]): InnertubeVideo[] {
    return items
      .filter((item) => item.videoRenderer)
      .map((item) => {
        const video = item.videoRenderer
        return {
          id: video.videoId || "",
          title: video.title?.runs?.[0]?.text || video.title?.simpleText || "Unknown Title",
          channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown Channel",
          thumbnail: this.extractThumbnail(video.thumbnail),
          duration: this.formatDuration(video.lengthText?.simpleText || video.lengthText?.runs?.[0]?.text),
          viewCount: video.viewCountText?.simpleText || "0",
          publishedAt: new Date().toISOString(),
        }
      })
  }

  private parseTrendingResults(sections: any[]): InnertubeVideo[] {
    const videos: InnertubeVideo[] = []

    for (const section of sections) {
      const contents = section?.itemSectionRenderer?.contents || []
      for (const item of contents) {
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
    if (!thumbnailData?.thumbnails) {
      return "/placeholder.svg?height=300&width=300"
    }

    const thumbnails = thumbnailData.thumbnails
    const highRes = thumbnails.find((t: any) => t.width >= 480) || thumbnails[thumbnails.length - 1]
    return highRes?.url || "/placeholder.svg?height=300&width=300"
  }

  private formatDuration(durationText: string): string {
    if (!durationText) return "3:30"

    // Duration is already in MM:SS or HH:MM:SS format from Innertube
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
