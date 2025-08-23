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
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      originalUrl: "https://music.youtube.com/",
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
    console.log("[v0] Enhanced Innertube API initialized with WEB_REMIX client")
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

  private async makeRequest(endpoint: string, data: any, useAuth = false): Promise<any> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": this.context.client.userAgent,
        "X-Goog-Api-Format-Version": "1",
        "X-YouTube-Client-Name": "67",
        "X-YouTube-Client-Version": this.context.client.clientVersion,
        "X-Origin": "https://music.youtube.com",
        Referer: "https://music.youtube.com/",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://music.youtube.com",
      }

      if (useAuth && this.cookie && this.cookieMap.SAPISID) {
        headers["Cookie"] = this.cookie
        const currentTime = Math.floor(Date.now() / 1000)
        const sapisidHash = await this.generateSapisidHash(currentTime, this.cookieMap.SAPISID)
        headers["Authorization"] = `SAPISIDHASH ${currentTime}_${sapisidHash}`
      }

      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          context: {
            ...this.context,
            user: {
              ...this.context.user,
              ...(this.visitorData && { visitorData: this.visitorData }),
              ...(useAuth && this.dataSyncId && { dataSyncId: this.dataSyncId }),
            },
          },
          ...data,
        }),
      })

      console.log("[v0] Innertube API response status:", response.status)

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

  private async generateSapisidHash(timestamp: number, sapisid: string): Promise<string> {
    const message = `${timestamp} ${sapisid} https://music.youtube.com`
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest("SHA-1", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  async getSearchSuggestions(input: string): Promise<SearchSuggestion[]> {
    console.log("[v0] Getting search suggestions for:", input)

    try {
      const data = await this.makeRequest("music/get_search_suggestions", {
        input: input,
      })

      const suggestions = data?.contents?.[0]?.searchSuggestionsSectionRenderer?.contents || []

      return suggestions
        .map((item: any) => ({
          text: item.searchSuggestionRenderer?.suggestion?.runs?.[0]?.text || "",
          boldText:
            item.searchSuggestionRenderer?.suggestion?.runs
              ?.filter((run: any) => run.bold)
              ?.map((run: any) => run.text) || [],
        }))
        .filter((s: SearchSuggestion) => s.text)
    } catch (error) {
      console.error("[v0] Search suggestions error:", error)
      return []
    }
  }

  async getQueue(videoIds?: string[], playlistId?: string): Promise<InnertubeVideo[]> {
    console.log("[v0] Getting queue for videoIds:", videoIds, "playlistId:", playlistId)

    try {
      const data = await this.makeRequest("music/get_queue", {
        videoIds: videoIds,
        playlistId: playlistId,
      })

      const queueItems = data?.queueDatas || []
      return queueItems.map((item: any) => this.parseVideoFromQueueItem(item)).filter(Boolean)
    } catch (error) {
      console.error("[v0] Queue error:", error)
      return []
    }
  }

  async likeVideo(videoId: string): Promise<boolean> {
    try {
      await this.makeRequest(
        "like/like",
        {
          target: { videoId: videoId },
        },
        true,
      )
      console.log("[v0] Successfully liked video:", videoId)
      return true
    } catch (error) {
      console.error("[v0] Like video error:", error)
      return false
    }
  }

  async unlikeVideo(videoId: string): Promise<boolean> {
    try {
      await this.makeRequest(
        "like/removelike",
        {
          target: { videoId: videoId },
        },
        true,
      )
      console.log("[v0] Successfully unliked video:", videoId)
      return true
    } catch (error) {
      console.error("[v0] Unlike video error:", error)
      return false
    }
  }

  async createPlaylist(title: string): Promise<string | null> {
    try {
      const data = await this.makeRequest(
        "playlist/create",
        {
          title: title,
        },
        true,
      )

      const playlistId = data?.playlistId
      console.log("[v0] Successfully created playlist:", playlistId)
      return playlistId
    } catch (error) {
      console.error("[v0] Create playlist error:", error)
      return null
    }
  }

  async addToPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    try {
      await this.makeRequest(
        "browse/edit_playlist",
        {
          playlistId: playlistId.replace("VL", ""),
          actions: [
            {
              action: "ACTION_ADD_VIDEO",
              addedVideoId: videoId,
            },
          ],
        },
        true,
      )
      console.log("[v0] Successfully added video to playlist")
      return true
    } catch (error) {
      console.error("[v0] Add to playlist error:", error)
      return false
    }
  }

  async getMediaInfo(videoId: string): Promise<MediaInfo | null> {
    try {
      const data = await this.makeRequest("next", {
        videoId: videoId,
      })

      const primaryInfo = data?.contents?.twoColumnWatchNextResults?.results?.results?.content?.find(
        (item: any) => item?.videoPrimaryInfoRenderer,
      )?.videoPrimaryInfoRenderer

      const secondaryInfo = data?.contents?.twoColumnWatchNextResults?.results?.results?.content?.find(
        (item: any) => item?.videoSecondaryInfoRenderer,
      )?.videoSecondaryInfoRenderer

      return {
        videoId,
        title: primaryInfo?.title?.runs?.[0]?.text,
        author: secondaryInfo?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text,
        authorId: secondaryInfo?.owner?.videoOwnerRenderer?.navigationEndpoint?.browseEndpoint?.browseId,
        authorThumbnail: secondaryInfo?.owner?.videoOwnerRenderer?.thumbnail?.thumbnails
          ?.find((t: any) => t.height === 48)
          ?.url?.replace("s48", "s960"),
        description: secondaryInfo?.attributedDescription?.content,
        subscribers: secondaryInfo?.owner?.videoOwnerRenderer?.subscriberCountText?.simpleText?.split(" ")?.[0],
        uploadDate: primaryInfo?.dateText?.simpleText,
        viewCount: 0, // Would need Return YouTube Dislike API integration
        like: 0,
        dislike: 0,
      }
    } catch (error) {
      console.error("[v0] Media info error:", error)
      return null
    }
  }

  private parseVideoFromQueueItem(item: any): InnertubeVideo | null {
    const content = item?.content
    if (!content) return null

    return {
      id: content.videoId || "",
      title: content.title?.runs?.[0]?.text || "Unknown Title",
      channelTitle: content.shortBylineText?.runs?.[0]?.text || "Unknown Channel",
      thumbnail: this.extractThumbnail(content.thumbnail),
      duration: this.formatDuration(content.lengthText?.simpleText),
      viewCount: "0",
      publishedAt: new Date().toISOString(),
    }
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
