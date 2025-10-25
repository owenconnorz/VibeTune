import { historyStorage } from "./history-storage"
import { getLikedSongs } from "./liked-storage"

export interface RecommendationSource {
  type: "history" | "liked" | "trending"
  weight: number
}

export function getTopArtists(limit = 10): string[] {
  const history = historyStorage.getHistory()
  const liked = getLikedSongs()

  // Combine history and liked songs
  const allSongs = [...history.map((h) => h.channelTitle), ...liked.map((l) => l.artist || l.channelTitle)]

  // Count artist occurrences
  const artistCounts = allSongs.reduce(
    (acc, artist) => {
      if (artist) {
        acc[artist] = (acc[artist] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  // Sort by count and return top artists
  return Object.entries(artistCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([artist]) => artist)
}

export function getTopGenres(): string[] {
  // This would ideally use genre data from the API
  // For now, we'll return common music genres
  return ["Pop", "Rock", "Hip Hop", "Electronic", "R&B", "Country", "Jazz", "Classical"]
}

export function getRecommendationSeeds(): {
  artists: string[]
  recentSongs: string[]
  likedSongs: string[]
} {
  const history = historyStorage.getHistory()
  const liked = getLikedSongs()

  return {
    artists: getTopArtists(5),
    recentSongs: history.slice(0, 5).map((h) => h.id),
    likedSongs: liked.slice(0, 5).map((l) => l.id),
  }
}

export function generatePersonalizedPlaylistName(): string {
  const hour = new Date().getHours()
  const topArtists = getTopArtists(3)

  const timeBasedNames = ["Morning Vibes", "Afternoon Energy", "Evening Chill", "Night Beats", "Late Night Mix"]

  const moodBasedNames = ["Your Daily Mix", "Discover Weekly", "Release Radar", "On Repeat", "Liked Songs Radio"]

  if (hour >= 5 && hour < 12) {
    return timeBasedNames[0]
  } else if (hour >= 12 && hour < 17) {
    return timeBasedNames[1]
  } else if (hour >= 17 && hour < 21) {
    return timeBasedNames[2]
  } else if (hour >= 21 && hour < 24) {
    return timeBasedNames[3]
  } else {
    return timeBasedNames[4]
  }
}
