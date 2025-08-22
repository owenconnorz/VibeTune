import { searchMusic as apiSearchMusic, fetchTrending } from "./innertube-api"

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

// Basic search function
export async function searchMusic(query: string): Promise<Song[]> {
  try {
    console.log("[v0] Searching music for:", query)
    const results = await apiSearchMusic(query)
    const videos = results.videos || []
    console.log("[v0] Search results:", videos.length, "songs")
    return videos.map((video) => ({
      id: video.id,
      title: video.title,
      artist: video.channelTitle,
      thumbnail: video.thumbnail,
      duration: video.duration,
      type: "song" as const,
    }))
  } catch (error) {
    console.error("[v0] Search error:", error)
    return []
  }
}

// Enhanced search with categories
export async function searchMusicEnhanced(query: string): Promise<EnhancedSearchResults> {
  try {
    console.log("[v0] Enhanced search for:", query)
    const searchResults = await apiSearchMusic(query)

    const allResults = searchResults.videos || []
    console.log("[v0] Enhanced search got results:", allResults.length, "items")

    // Categorize results based on content analysis
    const songs: Song[] = []
    const artists: Song[] = []
    const albums: Song[] = []
    const playlists: Song[] = []

    allResults.forEach((item) => {
      const song: Song = {
        id: item.id,
        title: item.title,
        artist: item.channelTitle,
        thumbnail: item.thumbnail,
        duration: item.duration,
        type: "song" as const,
      }

      // Categorize based on title patterns
      const title = song.title.toLowerCase()
      const artist = song.artist.toLowerCase()

      if (title.includes("playlist") || title.includes("mix")) {
        playlists.push(song)
      } else if (title.includes("album") || title.includes("full album")) {
        albums.push(song)
      } else if (title === artist || title.includes("artist") || title.includes("channel")) {
        artists.push(song)
      } else {
        songs.push(song)
      }
    })

    console.log("[v0] Categorized results:", {
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
    console.error("[v0] Enhanced search error:", error)
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
    console.log("[v0] Fetching trending music")
    const results = await fetchTrending()
    console.log("[v0] Trending results:", results.length, "songs")
    return results.map((video) => ({
      id: video.id,
      title: video.title,
      artist: video.channelTitle,
      thumbnail: video.thumbnail,
      duration: video.duration,
      type: "song" as const,
    }))
  } catch (error) {
    console.error("[v0] Trending fetch error:", error)
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
