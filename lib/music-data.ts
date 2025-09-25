import { createYtDlpExtractor } from "@/lib/ytdlp-extractor"

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
    console.log("[v0] Fetching trending music from yt-dlp")
    const ytdlp = createYtDlpExtractor()

    const results = await ytdlp.getTrending(maxResults)

    if (results && results.length > 0) {
      const songs = results.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        duration: song.duration,
        url: song.url,
        audioUrl: song.audioUrl,
      }))

      console.log(`[v0] Successfully fetched ${songs.length} trending songs from yt-dlp`)
      return songs.slice(0, maxResults)
    }

    console.log("[v0] No trending songs found from yt-dlp")
    return []
  } catch (error) {
    console.error("[v0] yt-dlp trending fetch failed:", error)
    throw error
  }
}

export async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  try {
    console.log(`[v0] Searching yt-dlp for: "${query}"`)
    const ytdlp = createYtDlpExtractor()

    const musicQuery =
      query.includes("music") || query.includes("song") || query.includes("artist") ? query : `${query} music`

    const results = await ytdlp.search(musicQuery, maxResults)

    if (results && results.length > 0) {
      const songs = results.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        duration: song.duration,
        url: song.url,
        audioUrl: song.audioUrl,
      }))

      console.log(`[v0] Successfully found ${songs.length} songs for "${query}"`)
      return songs
    } else {
      console.warn(`[v0] No results found for "${query}"`)
      return []
    }
  } catch (error) {
    console.error(`[v0] yt-dlp search failed for "${query}":`, error)
    throw error
  }
}

export async function getArtistSongs(artistName: string, maxResults = 15): Promise<Song[]> {
  try {
    console.log(`[v0] Fetching songs for artist: ${artistName}`)
    const ytdlp = createYtDlpExtractor()

    const artistQueries = [
      `${artistName} greatest hits`,
      `${artistName} popular songs`,
      `${artistName} best songs`,
      `${artistName} top tracks`,
    ]

    const allSongs: Song[] = []

    for (const query of artistQueries) {
      try {
        const results = await ytdlp.search(query, Math.ceil(maxResults / artistQueries.length))
        if (results && results.length > 0) {
          allSongs.push(
            ...results.map((song) => ({
              id: song.id,
              title: song.title,
              artist: song.artist,
              thumbnail: song.thumbnail,
              duration: song.duration,
              url: song.url,
              audioUrl: song.audioUrl,
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
    console.warn(`[v0] Playlist functionality not implemented for yt-dlp yet`)
    return []
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
    const ytdlp = createYtDlpExtractor()

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
        const results = await ytdlp.search(searchQuery, Math.ceil(maxResults / searchQueries.length))
        if (results && results.length > 0) {
          allResults.push(
            ...results.map((song) => ({
              id: song.id,
              title: song.title,
              artist: song.artist,
              thumbnail: song.thumbnail,
              duration: song.duration,
              url: song.url,
              audioUrl: song.audioUrl,
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
