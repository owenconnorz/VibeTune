// YouTube Music InnerTube API client based on SimpMusic's approach
interface InnerTubeContext {
  client: {
    clientName: string
    clientVersion: string
    platform: string
    osName: string
    osVersion: string
    userAgent: string
  }
  user: {
    lockedSafetyMode: boolean
  }
  request: {
    useSsl: boolean
    internalExperimentFlags: string[]
  }
}

interface SearchParams {
  query: string
  params?: string
}

interface BrowseParams {
  browseId: string
  params?: string
}

export class YouTubeMusicInnerTube {
  private static readonly BASE_URL = "https://music.youtube.com/youtubei/v1"
  private static readonly API_KEY = "AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30"

  private static readonly CONTEXT: InnerTubeContext = {
    client: {
      clientName: "WEB_REMIX",
      clientVersion: "1.20241202.01.00",
      platform: "DESKTOP",
      osName: "Windows",
      osVersion: "10.0",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    user: {
      lockedSafetyMode: false,
    },
    request: {
      useSsl: true,
      internalExperimentFlags: [],
    },
  }

  private static readonly HEADERS = {
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
    Origin: "https://music.youtube.com",
    Pragma: "no-cache",
    Referer: "https://music.youtube.com/",
    "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "same-origin",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "X-Goog-AuthUser": "0",
    "X-Goog-Visitor-Id": "CgtVcWJHVGVqWWVnOCiIjbG4BjIKCgJVUxIEGgAgOA%3D%3D",
    "X-Origin": "https://music.youtube.com",
    "X-Youtube-Bootstrap-Logged-In": "false",
    "X-Youtube-Client-Name": "67",
    "X-Youtube-Client-Version": "1.20241202.01.00",
  }

  private static async makeRequest(endpoint: string, body: any): Promise<any> {
    const url = `${this.BASE_URL}/${endpoint}?key=${this.API_KEY}&prettyPrint=false`

    console.log(`[v0] YouTube Music InnerTube: ${endpoint} request`)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.HEADERS,
        body: JSON.stringify({
          context: this.CONTEXT,
          ...body,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`[v0] YouTube Music InnerTube ${endpoint} error:`, error)
      throw error
    }
  }

  static async search(query: string, params?: string): Promise<any> {
    const body: SearchParams = { query }
    if (params) body.params = params

    return this.makeRequest("search", body)
  }

  static async browse(browseId: string, params?: string): Promise<any> {
    const body: BrowseParams = { browseId }
    if (params) body.params = params

    return this.makeRequest("browse", body)
  }

  static async getHome(): Promise<any> {
    return this.browse("FEmusic_home")
  }

  static async getExplore(): Promise<any> {
    return this.browse("FEmusic_explore")
  }

  static async getCharts(): Promise<any> {
    return this.browse("FEmusic_charts")
  }

  static async getNewReleases(): Promise<any> {
    return this.browse("FEmusic_new_releases")
  }

  static async getMoodsAndGenres(): Promise<any> {
    return this.browse("FEmusic_moods_and_genres")
  }

  static async searchSongs(query: string): Promise<any> {
    return this.search(query, "EgWKAQIIAWoKEAkQBRAKEAMQBA%3D%3D")
  }

  static async searchVideos(query: string): Promise<any> {
    return this.search(query, "EgWKAQIQAWoKEAkQBRAKEAMQBA%3D%3D")
  }

  static async searchAlbums(query: string): Promise<any> {
    return this.search(query, "EgWKAQIYAWoKEAkQBRAKEAMQBA%3D%3D")
  }

  static async searchArtists(query: string): Promise<any> {
    return this.search(query, "EgWKAQIgAWoKEAkQBRAKEAMQBA%3D%3D")
  }

  static async searchPlaylists(query: string): Promise<any> {
    return this.search(query, "EgeKAQQoADgBagwQDhAKEAMQBRAJEAQ%3D")
  }

  static async getVideoInfo(videoId: string): Promise<any> {
    console.log(`[v0] YouTube Music InnerTube: Getting video info for ${videoId}`)

    try {
      const response = await fetch(`${this.BASE_URL}/player?key=${this.API_KEY}&prettyPrint=false`, {
        method: "POST",
        headers: this.HEADERS,
        body: JSON.stringify({
          context: this.CONTEXT,
          videoId: videoId,
          playbackContext: {
            contentPlaybackContext: {
              html5Preference: "HTML5_PREF_WANTS",
              lactThreshold: 4000,
              referer: "https://music.youtube.com/",
              signatureTimestamp: Math.floor(Date.now() / 1000),
            },
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.playabilityStatus?.status !== "OK") {
        throw new Error(`Video not playable: ${data.playabilityStatus?.reason || "Unknown reason"}`)
      }

      if (!data.streamingData) {
        throw new Error("No streaming data available")
      }

      console.log(`[v0] YouTube Music InnerTube: Successfully got video info for ${videoId}`)
      return data
    } catch (error) {
      console.error(`[v0] YouTube Music InnerTube getVideoInfo error:`, error)
      throw error
    }
  }

  static async getLibraryPlaylists(): Promise<any[]> {
    console.log("[v0] YouTube Music InnerTube: Getting library playlists")
    
    try {
      const data = await this.browse("FEmusic_liked_playlists")
      
      // Parse playlists from response
      const playlists: any[] = []
      const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || []
      
      for (const section of contents) {
        const items = section?.musicCarouselShelfRenderer?.contents || section?.gridRenderer?.items || []
        
        for (const item of items) {
          const playlistData = item?.musicTwoRowItemRenderer || item?.musicResponsiveListItemRenderer
          if (playlistData) {
            const playlist = {
              id: playlistData.navigationEndpoint?.browseEndpoint?.browseId || "",
              title: playlistData.title?.runs?.[0]?.text || "Unknown Playlist",
              thumbnail: playlistData.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url || "",
              videoCount: playlistData.subtitle?.runs?.[0]?.text || "0",
            }
            playlists.push(playlist)
          }
        }
      }
      
      console.log(`[v0] YouTube Music InnerTube: Found ${playlists.length} playlists`)
      return playlists
    } catch (error) {
      console.error("[v0] YouTube Music InnerTube getLibraryPlaylists error:", error)
      return []
    }
  }

  static async getLikedSongs(): Promise<any[]> {
    console.log("[v0] YouTube Music InnerTube: Getting liked songs")
    
    try {
      const data = await this.browse("FEmusic_liked_videos")
      
      // Parse liked songs from response
      const songs: any[] = []
      const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || []
      
      for (const section of contents) {
        const items = section?.musicPlaylistShelfRenderer?.contents || section?.musicShelfRenderer?.contents || []
        
        for (const item of items) {
          const songData = item?.musicResponsiveListItemRenderer
          if (songData) {
            const song = {
              id: songData.playlistItemData?.videoId || songData.navigationEndpoint?.watchEndpoint?.videoId || "",
              title: songData.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "Unknown Title",
              artist: songData.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "Unknown Artist",
              thumbnail: songData.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url || "",
              duration: songData.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text || "0:00",
            }
            songs.push(song)
          }
        }
      }
      
      console.log(`[v0] YouTube Music InnerTube: Found ${songs.length} liked songs`)
      return songs
    } catch (error) {
      console.error("[v0] YouTube Music InnerTube getLikedSongs error:", error)
      return []
    }
  }
}
