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
    const response = await fetch("/api/music/trending?maxResults=10")
    if (!response.ok) throw new Error("Failed to fetch trending music")

    const data = await response.json()
    return data.videos.map((video: any) => ({
      id: video.id,
      title: video.title,
      artist: video.channelTitle,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: video.viewCount,
      audioUrl: video.audioUrl, // Include audioUrl in mapping
    }))
  } catch (error) {
    console.error("Error fetching trending music:", error)
    return []
  }
}

// Search for music
export async function searchMusic(query: string): Promise<Song[]> {
  try {
    const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}&maxResults=20`)
    if (!response.ok) throw new Error("Failed to search music")

    const data = await response.json()
    return data.videos.map((video: any) => ({
      id: video.id,
      title: video.title,
      artist: video.channelTitle,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: video.viewCount,
      audioUrl: video.audioUrl, // Include audioUrl in mapping
    }))
  } catch (error) {
    console.error("Error searching music:", error)
    return []
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
