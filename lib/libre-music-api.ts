// Libre.fm API integration for VibeTune
// Libre.fm is an open-source alternative to Last.fm

interface LibreTrack {
  id: string
  title: string
  artist: string
  album?: string
  duration?: string
  thumbnail?: string
  url?: string
  source: "libre"
}

interface LibreSearchResult {
  tracks: LibreTrack[]
  totalCount: number
  hasNextPage: boolean
  error?: string
}

export class LibreMusicAPI {
  private baseUrl = "https://libre.fm/2.0/"
  private apiKey = process.env.LIBRE_FM_API_KEY || "demo-key"

  async search(query: string, page = 1, limit = 20): Promise<LibreSearchResult> {
    try {
      console.log("[v0] Libre.fm: Searching for:", query)

      // Search for tracks using Libre.fm API
      const searchUrl = new URL(this.baseUrl)
      searchUrl.searchParams.append("method", "track.search")
      searchUrl.searchParams.append("track", query)
      searchUrl.searchParams.append("api_key", this.apiKey)
      searchUrl.searchParams.append("format", "json")
      searchUrl.searchParams.append("limit", limit.toString())
      searchUrl.searchParams.append("page", page.toString())

      const response = await fetch(searchUrl.toString())

      if (!response.ok) {
        throw new Error(`Libre.fm API error: ${response.status}`)
      }

      const data = await response.json()
      const tracks = this.parseSearchResults(data)

      console.log(`[v0] Libre.fm: Found ${tracks.length} tracks`)

      return {
        tracks,
        totalCount: parseInt(data.results?.["opensearch:totalResults"] || "0"),
        hasNextPage: tracks.length >= limit,
      }
    } catch (error) {
      console.error("[v0] Libre.fm search error:", error)
      return {
        tracks: [],
        totalCount: 0,
        hasNextPage: false,
        error: error instanceof Error ? error.message : "Search failed",
      }
    }
  }

  private parseSearchResults(data: any): LibreTrack[] {
    const tracks: LibreTrack[] = []

    try {
      const trackMatches = data.results?.trackmatches?.track || []
      const trackArray = Array.isArray(trackMatches) ? trackMatches : [trackMatches]

      for (const track of trackArray) {
        if (track && track.name) {
          tracks.push({
            id: track.mbid || `libre-${track.name}-${track.artist}`,
            title: track.name,
            artist: track.artist || "Unknown Artist",
            url: track.url,
            thumbnail: track.image?.[2]?.["#text"] || track.image?.[1]?.["#text"] || "",
            source: "libre" as const,
          })
        }
      }
    } catch (error) {
      console.warn("[v0] Error parsing Libre.fm results:", error)
    }

    return tracks
  }

  async getTopTracks(limit = 20): Promise<LibreSearchResult> {
    try {
      console.log("[v0] Libre.fm: Getting top tracks")

      const url = new URL(this.baseUrl)
      url.searchParams.append("method", "chart.getTopTracks")
      url.searchParams.append("api_key", this.apiKey)
      url.searchParams.append("format", "json")
      url.searchParams.append("limit", limit.toString())

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Libre.fm API error: ${response.status}`)
      }

      const data = await response.json()
      const tracks = this.parseTopTracks(data)

      return {
        tracks,
        totalCount: tracks.length,
        hasNextPage: false,
      }
    } catch (error) {
      console.error("[v0] Libre.fm top tracks error:", error)
      return {
        tracks: [],
        totalCount: 0,
        hasNextPage: false,
        error: error instanceof Error ? error.message : "Failed to get top tracks",
      }
    }
  }

  private parseTopTracks(data: any): LibreTrack[] {
    const tracks: LibreTrack[] = []

    try {
      const topTracks = data.tracks?.track || []
      const trackArray = Array.isArray(topTracks) ? topTracks : [topTracks]

      for (const track of trackArray) {
        if (track && track.name) {
          tracks.push({
            id: track.mbid || `libre-${track.name}-${track.artist?.name}`,
            title: track.name,
            artist: track.artist?.name || "Unknown Artist",
            url: track.url,
            thumbnail: track.image?.[2]?.["#text"] || track.image?.[1]?.["#text"] || "",
            source: "libre" as const,
          })
        }
      }
    } catch (error) {
      console.warn("[v0] Error parsing Libre.fm top tracks:", error)
    }

    return tracks
  }

  async getArtistTopTracks(artist: string, limit = 20): Promise<LibreSearchResult> {
    try {
      console.log("[v0] Libre.fm: Getting top tracks for artist:", artist)

      const url = new URL(this.baseUrl)
      url.searchParams.append("method", "artist.getTopTracks")
      url.searchParams.append("artist", artist)
      url.searchParams.append("api_key", this.apiKey)
      url.searchParams.append("format", "json")
      url.searchParams.append("limit", limit.toString())

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Libre.fm API error: ${response.status}`)
      }

      const data = await response.json()
      const tracks = this.parseTopTracks(data)

      return {
        tracks,
        totalCount: tracks.length,
        hasNextPage: false,
      }
    } catch (error) {
      console.error("[v0] Libre.fm artist top tracks error:", error)
      return {
        tracks: [],
        totalCount: 0,
        hasNextPage: false,
        error: error instanceof Error ? error.message : "Failed to get artist tracks",
      }
    }
  }
}

export const libreMusicAPI = new LibreMusicAPI()