export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  viewCount: string
  audioUrl?: string // Added optional audioUrl for playback
}

export interface Playlist {
  id: string
  title: string
  description: string
  thumbnail: string
  songs: Song[]
}

// Fetch trending music for home screen
export async function fetchTrendingMusic(): Promise<Song[]> {
  try {
    console.log("[v0] Fetching trending music...")
    const response = await fetch("/api/music/trending?maxResults=10")

    if (!response.ok) {
      console.log("[v0] Trending API response not ok:", response.status, response.statusText)
      throw new Error("Failed to fetch trending music")
    }

    const data = await response.json()
    console.log("[v0] Trending API response:", data)

    const results = data.videos.map((video: any) => ({
      id: video.id,
      title: video.title,
      artist: video.channelTitle,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: video.viewCount,
      audioUrl: video.audioUrl,
    }))

    console.log("[v0] Mapped trending results:", results.length, "songs")
    return results
  } catch (error) {
    console.error("[v0] Error fetching trending music:", error)
    const { fallbackTrendingMusic } = await import("@/lib/fallback-data")
    console.log("[v0] Using fallback trending data:", fallbackTrendingMusic.length, "songs")
    return fallbackTrendingMusic
  }
}

// Search for music
export async function searchMusic(query: string): Promise<Song[]> {
  try {
    console.log("[v0] Searching for:", query)
    const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}&maxResults=20`)

    if (!response.ok) {
      console.log("[v0] Search API response not ok:", response.status, response.statusText)
      throw new Error("Failed to search music")
    }

    const data = await response.json()
    console.log("[v0] Search API response:", data)

    const videos = data.videos || []
    const results = videos.map((video: any) => ({
      id: video.id,
      title: video.title,
      artist: video.channelTitle || video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: video.viewCount || "0",
      audioUrl: video.audioUrl,
    }))

    console.log("[v0] Mapped search results:", results.length, "songs")
    return results
  } catch (error) {
    console.error("[v0] Error searching music:", error)
    const { fallbackSearchResults } = await import("@/lib/fallback-data")
    const fallbackData = fallbackSearchResults[query.toLowerCase()] || fallbackSearchResults.default
    console.log("[v0] Using fallback search data:", fallbackData.length, "songs")
    return fallbackData
  }
}

// Predefined playlists for mood-based sections
export const moodPlaylists = {
  "morning-boost": {
    id: "morning-boost",
    title: "Morning Mood Boost",
    description: "Start your day with energy",
    queries: ["upbeat morning songs", "energetic pop music", "feel good hits"],
  },
  "chill-vibes": {
    id: "chill-vibes",
    title: "Chill Vibes",
    description: "Relaxing tunes for any time",
    queries: ["chill music", "relaxing songs", "ambient music"],
  },
  workout: {
    id: "workout",
    title: "Workout Hits",
    description: "High energy tracks for exercise",
    queries: ["workout music", "gym songs", "high energy music"],
  },
}
