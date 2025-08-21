export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  viewCount: string
  audioUrl?: string
}

export interface Playlist {
  id: string
  title: string
  description: string
  thumbnail: string
  songs: Song[]
}

function generateAlbumArtwork(title: string, artist: string): string {
  // Extract album name from title (remove common patterns)
  const cleanTitle = title
    .replace(/$$Official.*?$$/gi, "")
    .replace(/\[Official.*?\]/gi, "")
    .replace(/- Official.*$/gi, "")
    .replace(/Official.*$/gi, "")
    .replace(/$$.*?Video.*?$$/gi, "")
    .replace(/\[.*?Video.*?\]/gi, "")
    .replace(/HD|4K|Audio|Lyrics/gi, "")
    .trim()

  const cleanArtist = artist
    .replace(/VEVO|Official|Records|Music/gi, "")
    .replace(/\s+/g, " ")
    .trim()

  // Generate a color based on artist name for consistent theming
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ]

  let hash = 0
  for (let i = 0; i < cleanArtist.length; i++) {
    hash = cleanArtist.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % colors.length
  const backgroundColor = colors[colorIndex]

  // Create album artwork URL with artist and song info
  const encodedTitle = encodeURIComponent(cleanTitle.substring(0, 20))
  const encodedArtist = encodeURIComponent(cleanArtist.substring(0, 15))

  return `/placeholder.svg?height=300&width=300&text=${encodedArtist}%0A${encodedTitle}&bg=${backgroundColor.replace("#", "")}&color=white`
}

export async function fetchTrendingMusic(): Promise<Song[]> {
  try {
    const response = await fetch("/api/music/trending?maxResults=10")

    if (!response.ok) {
      throw new Error("Failed to fetch trending music")
    }

    const data = await response.json()

    const results = data.videos.map((video: any) => ({
      id: video.id,
      title: video.title,
      artist: video.channelTitle,
      thumbnail: generateAlbumArtwork(video.title, video.channelTitle),
      duration: video.duration,
      viewCount: video.viewCount,
      audioUrl: video.audioUrl,
    }))

    return results
  } catch (error) {
    console.error("Error fetching trending music:", error)
    const { fallbackTrendingMusic } = await import("@/lib/fallback-data")
    return fallbackTrendingMusic
  }
}

export async function searchMusic(query: string): Promise<Song[]> {
  try {
    const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}&maxResults=20`)

    if (!response.ok) {
      throw new Error("Failed to search music")
    }

    const data = await response.json()

    const videos = data.videos || []
    const results = videos.map((video: any) => ({
      id: video.id,
      title: video.title,
      artist: video.channelTitle || video.artist,
      thumbnail: generateAlbumArtwork(video.title, video.channelTitle || video.artist),
      duration: video.duration,
      viewCount: video.viewCount || "0",
      audioUrl: video.audioUrl,
    }))

    return results
  } catch (error) {
    console.error("Error searching music:", error)
    const { fallbackSearchResults } = await import("@/lib/fallback-data")
    const fallbackData = fallbackSearchResults[query.toLowerCase()] || fallbackSearchResults.default
    return fallbackData
  }
}

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
