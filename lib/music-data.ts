import { createYouTubeDataAPI } from "@/lib/youtube-data-api"

export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  url?: string
  audioUrl?: string
}

export async function fetchTrendingMusic(maxResults = 20): Promise<Song[]> {
  try {
    console.log("[v0] Fetching trending music from YouTube API")
    const youtubeAPI = createYouTubeDataAPI()

    // Use multiple trending queries to get diverse results
    const trendingQueries = [
      "trending music 2024",
      "popular songs now",
      "top hits today",
      "viral music",
      "chart toppers",
    ]

    const allSongs: Song[] = []

    for (const query of trendingQueries) {
      try {
        const results = await youtubeAPI.search(query, Math.ceil(maxResults / trendingQueries.length))
        if (results && results.length > 0) {
          allSongs.push(...results)
        }
      } catch (error) {
        console.warn(`[v0] Failed to fetch trending for "${query}":`, error)
      }
    }

    // Remove duplicates and limit results
    const uniqueSongs = allSongs
      .filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
      .slice(0, maxResults)

    console.log(`[v0] Successfully fetched ${uniqueSongs.length} trending songs from YouTube API`)
    return uniqueSongs
  } catch (error) {
    console.error("[v0] YouTube API trending fetch failed:", error)
    throw error
  }
}

export async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  try {
    console.log(`[v0] Searching YouTube API for: "${query}"`)
    const youtubeAPI = createYouTubeDataAPI()

    // Enhance search query for better music results
    const musicQuery =
      query.includes("music") || query.includes("song") || query.includes("artist") ? query : `${query} music`

    const results = await youtubeAPI.search(musicQuery, maxResults)

    if (results && results.length > 0) {
      console.log(`[v0] Successfully found ${results.length} songs for "${query}"`)
      return results
    } else {
      console.warn(`[v0] No results found for "${query}"`)
      return []
    }
  } catch (error) {
    console.error(`[v0] YouTube API search failed for "${query}":`, error)
    throw error
  }
}

export async function getArtistSongs(artistName: string, maxResults = 15): Promise<Song[]> {
  try {
    console.log(`[v0] Fetching songs for artist: ${artistName}`)
    const youtubeAPI = createYouTubeDataAPI()

    // Search for artist's popular songs
    const artistQueries = [
      `${artistName} greatest hits`,
      `${artistName} popular songs`,
      `${artistName} best songs`,
      `${artistName} top tracks`,
    ]

    const allSongs: Song[] = []

    for (const query of artistQueries) {
      try {
        const results = await youtubeAPI.search(query, Math.ceil(maxResults / artistQueries.length))
        if (results && results.length > 0) {
          allSongs.push(...results)
        }
      } catch (error) {
        console.warn(`[v0] Failed to fetch artist songs for "${query}":`, error)
      }
    }

    // Remove duplicates and limit results
    const uniqueSongs = allSongs
      .filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
      .slice(0, maxResults)

    console.log(`[v0] Successfully fetched ${uniqueSongs.length} songs for ${artistName}`)
    return uniqueSongs
  } catch (error) {
    console.error(`[v0] Failed to fetch artist songs for ${artistName}:`, error)
    throw error
  }
}

export async function getPlaylistSongs(playlistId: string): Promise<Song[]> {
  try {
    console.log(`[v0] Fetching playlist songs for ID: ${playlistId}`)
    const youtubeAPI = createYouTubeDataAPI()

    const results = await youtubeAPI.getPlaylist(playlistId)

    if (results && results.length > 0) {
      console.log(`[v0] Successfully fetched ${results.length} songs from playlist`)
      return results
    } else {
      console.warn(`[v0] No songs found in playlist ${playlistId}`)
      return []
    }
  } catch (error) {
    console.error(`[v0] Failed to fetch playlist ${playlistId}:`, error)
    throw error
  }
}

export function generateAlbumArtwork(song: Song): string {
  // Generate album artwork URL based on song data
  if (song.thumbnail && song.thumbnail !== "/placeholder.svg") {
    return song.thumbnail
  }

  // Generate placeholder with song info
  const artistInitial = song.artist.charAt(0).toUpperCase()
  const titleInitial = song.title.charAt(0).toUpperCase()
  return `/placeholder.svg?height=300&width=300&text=${artistInitial}${titleInitial}`
}

export async function searchMusicEnhanced(
  query: string,
  options: {
    maxResults?: number
    includeArtist?: boolean
    includeAlbum?: boolean
    sortBy?: "relevance" | "date" | "viewCount"
  } = {},
): Promise<Song[]> {
  const { maxResults = 10, includeArtist = true, includeAlbum = false, sortBy = "relevance" } = options

  try {
    console.log(`[v0] Enhanced search for: "${query}" with options:`, options)
    const youtubeAPI = createYouTubeDataAPI()

    // Build enhanced search queries
    const searchQueries: string[] = [query]

    if (includeArtist && !query.includes("artist")) {
      searchQueries.push(`${query} artist`)
    }

    if (includeAlbum && !query.includes("album")) {
      searchQueries.push(`${query} album`)
    }

    const allResults: Song[] = []

    for (const searchQuery of searchQueries) {
      try {
        const results = await youtubeAPI.search(searchQuery, Math.ceil(maxResults / searchQueries.length))
        if (results && results.length > 0) {
          allResults.push(...results)
        }
      } catch (error) {
        console.warn(`[v0] Enhanced search failed for "${searchQuery}":`, error)
      }
    }

    // Remove duplicates and sort results
    let uniqueResults = allResults.filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))

    // Apply sorting (basic implementation since YouTube API handles most sorting)
    if (sortBy === "date") {
      // YouTube API already sorts by date when requested
      uniqueResults = uniqueResults.reverse()
    }

    const finalResults = uniqueResults.slice(0, maxResults)
    console.log(`[v0] Enhanced search returned ${finalResults.length} results`)

    return finalResults
  } catch (error) {
    console.error(`[v0] Enhanced search failed for "${query}":`, error)
    throw error
  }
}
