import type { Track } from "./track" // Assuming Track is defined in a separate file
import { createYouTubeAPI } from "./youtube-api" // Assuming createYouTubeAPI is defined in a separate file

export function generateAlbumArtwork(artist: string, title: string): string {
  // Generate a consistent color based on artist name
  const colors = ["FF6B6B", "4ECDC4", "45B7D1", "96CEB4", "FFEAA7", "DDA0DD", "F39C12", "E74C3C"]
  const colorIndex = artist.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const bgColor = colors[colorIndex]

  // Get artist initials
  const initials = artist
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  console.log("[v0] Generated album artwork for:", artist, title, "Color:", bgColor)

  // Use a simple placeholder service with solid color background
  return `https://via.placeholder.com/300x300/${bgColor}/ffffff?text=${encodeURIComponent(initials)}`
}

export const moodPlaylists = {
  "morning-boost": {
    name: "Morning Boost",
    queries: ["morning music energetic upbeat", "feel good pop rock", "upbeat classics hits"],
  },
  sleep: {
    name: "Sleep",
    queries: ["sleep music ambient relaxing", "peaceful instrumental", "calm meditation"],
  },
  chill: {
    name: "Chill",
    queries: ["chill music lofi relaxed", "ambient downtempo", "relaxing vibes"],
  },
  workout: {
    name: "Workout",
    queries: ["workout music energetic pump up", "gym motivation", "high energy beats"],
  },
  focus: {
    name: "Focus",
    queries: ["focus music concentration study", "instrumental background", "productivity music"],
  },
  party: {
    name: "Party",
    queries: ["party music dance upbeat", "club hits", "dance floor anthems"],
  },
  sad: {
    name: "Sad",
    queries: ["sad music emotional melancholy", "heartbreak songs", "emotional ballads"],
  },
  happy: {
    name: "Happy",
    queries: ["happy music upbeat cheerful", "feel good hits", "positive vibes"],
  },
  romantic: {
    name: "Romance",
    queries: ["romantic music love songs", "slow dance", "love ballads"],
  },
}

export async function fetchTrendingMusic(): Promise<Track[]> {
  try {
    console.log("[v0] Fetching trending music...")
    const youtube = createYouTubeAPI()
    const results = await youtube.getTrendingMusic()
    console.log("[v0] Trending music results:", results.length)
    return results
  } catch (error) {
    console.error("[v0] Error fetching trending music:", error)
    // Return fallback data with album artwork
    return [
      {
        id: "trending-1",
        title: "Popular Song 1",
        artist: "Trending Artist",
        duration: "3:45",
        thumbnail: generateAlbumArtwork("Trending Artist", "Popular Song 1"),
        videoId: "trending-1",
      },
      {
        id: "trending-2",
        title: "Hit Song 2",
        artist: "Chart Topper",
        duration: "4:12",
        thumbnail: generateAlbumArtwork("Chart Topper", "Hit Song 2"),
        videoId: "trending-2",
      },
    ]
  }
}

export async function searchMusic(query: string): Promise<Track[]> {
  try {
    console.log("[v0] Searching music for:", query)
    const youtube = createYouTubeAPI()
    const results = await youtube.searchMusic(query)
    console.log("[v0] Search results:", results.length)
    return results
  } catch (error) {
    console.error("[v0] Error searching music:", error)
    // Return fallback data with album artwork
    return [
      {
        id: "search-1",
        title: `${query} - Sample Result`,
        artist: "Search Artist",
        duration: "3:30",
        thumbnail: generateAlbumArtwork("Search Artist", `${query} - Sample Result`),
        videoId: "search-1",
      },
    ]
  }
}
