import type { YouTubeVideo } from "./youtube"

const STORAGE_KEY = "opentune_liked_songs"

export function getLikedSongs(): YouTubeVideo[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function isLiked(videoId: string): boolean {
  const likedSongs = getLikedSongs()
  return likedSongs.some((song) => song.id === videoId)
}

export function toggleLikedSong(video: YouTubeVideo): boolean {
  const likedSongs = getLikedSongs()
  const index = likedSongs.findIndex((song) => song.id === video.id)

  if (index === -1) {
    // Add to liked songs
    likedSongs.push(video)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likedSongs))
    return true // Now liked
  } else {
    // Remove from liked songs
    likedSongs.splice(index, 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likedSongs))
    return false // Now unliked
  }
}

export function getLikedSongsCount(): number {
  return getLikedSongs().length
}
