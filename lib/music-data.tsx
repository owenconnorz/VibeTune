// Song interface for type safety
export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  type: "song"
}

// Enhanced search results interface
export interface EnhancedSearchResults {
  all: Song[]
  songs: Song[]
  artists: Song[]
  albums: Song[]
  playlists: Song[]
}

// Generate album artwork with artist initials
export function generateAlbumArtwork(artist: string, title?: string): string {
  // Create a hash from the artist name for consistent colors
  let hash = 0
  for (let i = 0; i < artist.length; i++) {
    const char = artist.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Generate color from hash
  const hue = Math.abs(hash) % 360
  const saturation = 60 + (Math.abs(hash) % 40) // 60-100%
  const lightness = 45 + (Math.abs(hash) % 20) // 45-65%

  // Get artist initials
  const initials = artist
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")

  // Create SVG
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="hsl(${hue}, ${saturation}%, ${lightness}%)"/>
      <text x="100" y="120" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" 
            textAnchor="middle" fill="white" opacity="0.9">${initials}</text>
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export async function searchMusic(query: string): Promise<Song[]> {
  try {
    console.log("[v0] Searching music with enhanced YouTube Music API for:", query)

    // Use the enhanced search API
    const response = await fetch(`/api/youtube-music/search?query=${encodeURIComponent(query)}&type=songs&useAuth=true`)
    if (!response.ok) {
      throw new Error(`Enhanced search failed: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Enhanced YouTube Music API search results:", data.tracks?.length || 0, "songs")

    return (data.tracks || []).map((track: any) => ({
      id: track.id,
      title: track.title,
      artist: track.channelTitle || track.artist,
      thumbnail: track.thumbnail || generateAlbumArtwork(track.channelTitle || track.artist, track.title),
      duration: track.duration || "0:00",
      type: "song" as const,
    }))
  } catch (error) {
    console.error("[v0] Enhanced YouTube Music API search error:", error)
    return []
  }
}

export async function searchMusicEnhanced(query: string, page = 1): Promise<EnhancedSearchResults> {
  try {
    console.log("[v0] Enhanced search with SimpMusic integration for:", query, "page:", page)

    // Search all types with enhanced API
    const response = await fetch(
      `/api/youtube-music/search?query=${encodeURIComponent(query)}&page=${page}&type=all&useAuth=true`,
    )
    if (!response.ok) {
      throw new Error(`Enhanced search failed: ${response.status}`)
    }

    const data = await response.json()
    const allResults = data.tracks || []
    console.log("[v0] Enhanced YouTube Music API got results:", allResults.length, "items")

    // Categorize results based on type from API
    const songs: Song[] = []
    const artists: Song[] = []
    const albums: Song[] = []
    const playlists: Song[] = []

    allResults.forEach((item: any) => {
      const song: Song = {
        id: item.id,
        title: item.title,
        artist: item.channelTitle || item.artist || "Unknown Artist",
        thumbnail:
          item.thumbnail || generateAlbumArtwork(item.channelTitle || item.artist || "Unknown Artist", item.title),
        duration: item.duration || "0:00",
        type: "song" as const,
      }

      // Use API-provided type or fallback to pattern matching
      const itemType = item.type || "song"

      switch (itemType) {
        case "artist":
          artists.push(song)
          break
        case "album":
          albums.push(song)
          break
        case "playlist":
          playlists.push(song)
          break
        case "video":
        case "song":
        default:
          songs.push(song)
          break
      }
    })

    console.log("[v0] Enhanced categorized results:", {
      songs: songs.length,
      artists: artists.length,
      albums: albums.length,
      playlists: playlists.length,
    })

    return {
      all: songs.concat(artists, albums, playlists),
      songs,
      artists,
      albums,
      playlists,
    }
  } catch (error) {
    console.error("[v0] Enhanced YouTube Music API search error:", error)
    return {
      all: [],
      songs: [],
      artists: [],
      albums: [],
      playlists: [],
    }
  }
}

// Fetch trending music
export async function fetchTrendingMusic(): Promise<Song[]> {
  try {
    console.log("[v0] Fetching trending music with advanced YouTube API")
    const response = await fetch("/api/music/trending")
    if (!response.ok) {
      throw new Error(`Trending fetch failed: ${response.status}`)
    }
    const data = await response.json()
    console.log("[v0] YouTube API trending results:", data.songs?.length || 0, "songs")
    return data.songs || []
  } catch (error) {
    console.error("[v0] YouTube API trending fetch error:", error)
    return []
  }
}

// Mood playlists configuration
export const moodPlaylists = {
  "morning-boost": {
    name: "Morning Mood Boost",
    description: "Start your day with energy",
    queries: ["upbeat morning songs", "energetic pop music", "feel good hits"],
  },
  chill: {
    name: "Chill Vibes",
    description: "Relaxing background music",
    queries: ["chill music", "relaxing songs", "ambient music"],
  },
  workout: {
    name: "Workout Mix",
    description: "High energy workout music",
    queries: ["workout music", "gym songs", "high energy music"],
  },
}
