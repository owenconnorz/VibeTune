import type { YouTubeVideo } from "./youtube"

export interface Playlist {
  id: string
  name: string
  description?: string
  coverImage?: string
  videos: YouTubeVideo[]
  createdAt: string
  updatedAt: string
  synced?: boolean
}

const STORAGE_KEY = "opentune_playlists"

export function getPlaylists(): Playlist[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function savePlaylist(playlist: Omit<Playlist, "id" | "createdAt" | "updatedAt">): Playlist {
  const playlists = getPlaylists()
  const newPlaylist: Playlist = {
    ...playlist,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: playlist.description?.includes("Synced with YouTube Music"),
  }
  playlists.push(newPlaylist)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists))
  return newPlaylist
}

export function updatePlaylist(id: string, updates: Partial<Omit<Playlist, "id" | "createdAt">>): Playlist | null {
  const playlists = getPlaylists()
  const index = playlists.findIndex((p) => p.id === id)
  if (index === -1) return null

  playlists[index] = {
    ...playlists[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists))
  return playlists[index]
}

export function deletePlaylist(id: string): boolean {
  const playlists = getPlaylists()
  const filtered = playlists.filter((p) => p.id !== id)
  if (filtered.length === playlists.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

export function addVideoToPlaylist(playlistId: string, video: YouTubeVideo): Playlist | null {
  const playlists = getPlaylists()
  const playlist = playlists.find((p) => p.id === playlistId)
  if (!playlist) return null

  // Check if video already exists
  if (playlist.videos.some((v) => v.id === video.id)) {
    return playlist
  }

  return updatePlaylist(playlistId, {
    videos: [...playlist.videos, video],
  })
}

export function removeVideoFromPlaylist(playlistId: string, videoId: string): Playlist | null {
  const playlists = getPlaylists()
  const playlist = playlists.find((p) => p.id === playlistId)
  if (!playlist) return null

  return updatePlaylist(playlistId, {
    videos: playlist.videos.filter((v) => v.id !== videoId),
  })
}
