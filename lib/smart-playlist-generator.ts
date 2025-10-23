import type { YouTubeVideo } from "./youtube"
import { historyStorage } from "./history-storage"

export interface SmartPlaylistTemplate {
  id: string
  name: string
  description: string
  icon: string
  searchQueries: string[]
  color: string
}

export const smartPlaylistTemplates: SmartPlaylistTemplate[] = [
  {
    id: "discover-weekly",
    name: "Discover Weekly",
    description: "Fresh music picks based on your taste",
    icon: "sparkles",
    searchQueries: ["new music", "trending songs", "viral music"],
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "happy-vibes",
    name: "Happy Vibes",
    description: "Upbeat songs to boost your mood",
    icon: "smile",
    searchQueries: ["happy music", "feel good songs", "upbeat music", "positive vibes"],
    color: "from-yellow-400 to-orange-500",
  },
  {
    id: "chill-mode",
    name: "Chill Mode",
    description: "Relaxing tunes for unwinding",
    icon: "cloud",
    searchQueries: ["chill music", "relaxing songs", "calm music", "lo-fi beats"],
    color: "from-blue-400 to-cyan-500",
  },
  {
    id: "workout-energy",
    name: "Workout Energy",
    description: "High-energy tracks for your workout",
    icon: "zap",
    searchQueries: ["workout music", "gym music", "energetic songs", "pump up music"],
    color: "from-red-500 to-orange-600",
  },
  {
    id: "focus-flow",
    name: "Focus Flow",
    description: "Concentration music for studying",
    icon: "brain",
    searchQueries: ["study music", "focus music", "concentration music", "ambient study"],
    color: "from-indigo-500 to-purple-600",
  },
  {
    id: "sleep-sounds",
    name: "Sleep Sounds",
    description: "Peaceful music for better sleep",
    icon: "moon",
    searchQueries: ["sleep music", "peaceful music", "bedtime music", "calming sounds"],
    color: "from-indigo-900 to-purple-900",
  },
  {
    id: "sad-songs",
    name: "Sad Songs",
    description: "Emotional tracks for when you need to feel",
    icon: "cloud-rain",
    searchQueries: ["sad music", "emotional songs", "heartbreak music", "melancholic"],
    color: "from-gray-600 to-blue-800",
  },
  {
    id: "party-hits",
    name: "Party Hits",
    description: "Dance and party anthems",
    icon: "music",
    searchQueries: ["party music", "dance hits", "club music", "party anthems"],
    color: "from-pink-500 to-rose-600",
  },
]

export async function generateSmartPlaylist(templateId: string): Promise<YouTubeVideo[]> {
  const template = smartPlaylistTemplates.find((t) => t.id === templateId)
  if (!template) {
    throw new Error("Template not found")
  }

  // Get random query from template
  const randomQuery = template.searchQueries[Math.floor(Math.random() * template.searchQueries.length)]

  try {
    const response = await fetch(`/api/music/search?q=${encodeURIComponent(randomQuery)}&limit=30`)
    const data = await response.json()

    if (data.success && data.results) {
      return data.results
    }

    return []
  } catch (error) {
    console.error("[v0] Error generating smart playlist:", error)
    return []
  }
}

export async function generateDiscoverWeekly(): Promise<YouTubeVideo[]> {
  const history = historyStorage.getHistory()

  if (history.length === 0) {
    // No history, return trending music
    return generateSmartPlaylist("discover-weekly")
  }

  // Get most played artists from history
  const artistCounts = new Map<string, number>()
  history.forEach((video) => {
    const count = artistCounts.get(video.channelTitle) || 0
    artistCounts.set(video.channelTitle, count + 1)
  })

  // Get top 3 artists
  const topArtists = Array.from(artistCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([artist]) => artist)

  if (topArtists.length === 0) {
    return generateSmartPlaylist("discover-weekly")
  }

  // Search for similar music
  const randomArtist = topArtists[Math.floor(Math.random() * topArtists.length)]
  const queries = [`${randomArtist} similar artists`, `music like ${randomArtist}`, `${randomArtist} type music`]

  const randomQuery = queries[Math.floor(Math.random() * queries.length)]

  try {
    const response = await fetch(`/api/music/search?q=${encodeURIComponent(randomQuery)}&limit=30`)
    const data = await response.json()

    if (data.success && data.results) {
      // Filter out songs already in history
      const historyIds = new Set(history.map((v) => v.id))
      return data.results.filter((video: YouTubeVideo) => !historyIds.has(video.id))
    }

    return []
  } catch (error) {
    console.error("[v0] Error generating discover weekly:", error)
    return []
  }
}
