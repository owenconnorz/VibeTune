import { createPipedAPI } from "@/lib/piped-api"

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
    console.log("[v0] Fetching trending music from Piped API")
    const pipedAPI = createPipedAPI()

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
        const results = await pipedAPI.search(query, Math.ceil(maxResults / trendingQueries.length))
        if (results.videos && results.videos.length > 0) {
          allSongs.push(
            ...results.videos.map((video) => ({
              id: video.id,
              title: video.title,
              artist: video.artist,
              thumbnail: video.thumbnail,
              duration: video.duration,
              url: video.url,
              audioUrl: video.audioUrl,
            })),
          )
        }
      } catch (error) {
        console.warn(`[v0] Failed to fetch trending for "${query}":`, error)
      }
    }

    const uniqueSongs = allSongs
      .filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
      .slice(0, maxResults)

    console.log(`[v0] Successfully fetched ${uniqueSongs.length} trending songs from Piped API`)
    return uniqueSongs
  } catch (error) {
    console.error("[v0] Piped API trending fetch failed:", error)
    throw error
  }
}

export async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  try {
    console.log(`[v0] Searching Piped API for: "${query}"`)
    const pipedAPI = createPipedAPI()

    const musicQuery =
      query.includes("music") || query.includes("song") || query.includes("artist") ? query : `${query} music`

    const results = await pipedAPI.search(musicQuery, maxResults)

    if (results.videos && results.videos.length > 0) {
      const songs = results.videos.map((video) => ({
        id: video.id,
        title: video.title,
        artist: video.artist,
        thumbnail: video.thumbnail,
        duration: video.duration,
        url: video.url,
        audioUrl: video.audioUrl,
      }))

      console.log(`[v0] Successfully found ${songs.length} songs for "${query}"`)
      return songs
    } else {
      console.warn(`[v0] No results found for "${query}"`)
      return []
    }
  } catch (error) {
    console.error(`[v0] Piped API search failed for "${query}":`, error)
    throw error
  }
}

export async function getArtistSongs(artistName: string, maxResults = 15): Promise<Song[]> {
  try {
    console.log(`[v0] Fetching songs for artist: ${artistName}`)
    const pipedAPI = createPipedAPI()

    const artistQueries = [
      `${artistName} greatest hits`,
      `${artistName} popular songs`,
      `${artistName} best songs`,
      `${artistName} top tracks`,
    ]

    const allSongs: Song[] = []

    for (const query of artistQueries) {
      try {
        const results = await pipedAPI.search(query, Math.ceil(maxResults / artistQueries.length))
        if (results.videos && results.videos.length > 0) {
          allSongs.push(
            ...results.videos.map((video) => ({
              id: video.id,
              title: video.title,
              artist: video.artist,
              thumbnail: video.thumbnail,
              duration: video.duration,
              url: video.url,
              audioUrl: video.audioUrl,
            })),
          )
        }
      } catch (error) {
        console.warn(`[v0] Failed to fetch artist songs for "${query}":`, error)
      }
    }

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
    const pipedAPI = createPipedAPI()

    const results = await pipedAPI.getPlaylist(playlistId)

    if (results.videos && results.videos.length > 0) {
      const songs = results.videos.map((video) => ({
        id: video.id,
        title: video.title,
        artist: video.artist,
        thumbnail: video.thumbnail,
        duration: video.duration,
        url: video.url,
        audioUrl: video.audioUrl,
      }))

      console.log(`[v0] Successfully fetched ${songs.length} songs from playlist`)
      return songs
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
    const pipedAPI = createPipedAPI()

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
        const results = await pipedAPI.search(searchQuery, Math.ceil(maxResults / searchQueries.length))
        if (results.videos && results.videos.length > 0) {
          allResults.push(
            ...results.videos.map((video) => ({
              id: video.id,
              title: video.title,
              artist: video.artist,
              thumbnail: video.thumbnail,
              duration: video.duration,
              url: video.url,
              audioUrl: video.audioUrl,
            })),
          )
        }
      } catch (error) {
        console.warn(`[v0] Enhanced search failed for "${searchQuery}":`, error)
      }
    }

    let uniqueResults = allResults.filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))

    if (sortBy === "date") {
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
