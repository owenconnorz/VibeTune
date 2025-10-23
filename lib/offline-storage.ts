const STORAGE_KEY = "vibetune_offline_songs"
const CACHE_NAME = "vibetune-audio-cache"

export interface OfflineSong {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  audioUrl: string
  downloadedAt: number
  size: number
}

export const offlineStorage = {
  getOfflineSongs(): OfflineSong[] {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  async addOfflineSong(song: Omit<OfflineSong, "downloadedAt" | "size">): Promise<boolean> {
    try {
      // Cache the audio file
      const cache = await caches.open(CACHE_NAME)
      const response = await fetch(song.audioUrl)

      if (!response.ok) {
        throw new Error("Failed to fetch audio")
      }

      const blob = await response.blob()
      await cache.put(song.audioUrl, new Response(blob))

      // Store metadata
      const songs = this.getOfflineSongs()
      const newSong: OfflineSong = {
        ...song,
        downloadedAt: Date.now(),
        size: blob.size,
      }

      const updated = [newSong, ...songs.filter((s) => s.id !== song.id)]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event("offlineStorageChanged"))

      return true
    } catch (error) {
      console.error("[v0] Failed to add offline song:", error)
      return false
    }
  },

  async removeOfflineSong(songId: string): Promise<void> {
    try {
      const songs = this.getOfflineSongs()
      const song = songs.find((s) => s.id === songId)

      if (song) {
        // Remove from cache
        const cache = await caches.open(CACHE_NAME)
        await cache.delete(song.audioUrl)
      }

      // Remove from storage
      const updated = songs.filter((s) => s.id !== songId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event("offlineStorageChanged"))
    } catch (error) {
      console.error("[v0] Failed to remove offline song:", error)
    }
  },

  async clearAllOffline(): Promise<void> {
    try {
      await caches.delete(CACHE_NAME)
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new Event("offlineStorageChanged"))
    } catch (error) {
      console.error("[v0] Failed to clear offline storage:", error)
    }
  },

  isOffline(songId: string): boolean {
    const songs = this.getOfflineSongs()
    return songs.some((s) => s.id === songId)
  },

  async getOfflineAudioUrl(songId: string): Promise<string | null> {
    try {
      const songs = this.getOfflineSongs()
      const song = songs.find((s) => s.id === songId)

      if (!song) return null

      const cache = await caches.open(CACHE_NAME)
      const response = await cache.match(song.audioUrl)

      if (!response) return null

      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error("[v0] Failed to get offline audio:", error)
      return null
    }
  },

  getTotalSize(): number {
    const songs = this.getOfflineSongs()
    return songs.reduce((total, song) => total + song.size, 0)
  },

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  },
}
