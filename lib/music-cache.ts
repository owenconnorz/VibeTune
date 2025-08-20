"use client"

export interface CachedMusicData {
  data: any
  timestamp: number
  expiresAt: number
  size: number
}

export interface CacheStats {
  totalItems: number
  totalSize: number
  oldestItem: number | null
  newestItem: number | null
}

export interface CacheSettings {
  maxSize: number // in MB
  defaultTTL: number // in milliseconds
  enabled: boolean
}

class MusicCacheManager {
  private readonly CACHE_PREFIX = "vibetune_music_"
  private readonly SETTINGS_KEY = "vibetune_cache_settings"

  private defaultSettings: CacheSettings = {
    maxSize: 50, // 50MB default
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    enabled: true,
  }

  getSettings(): CacheSettings {
    if (typeof window === "undefined") return this.defaultSettings

    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY)
      if (stored) {
        return { ...this.defaultSettings, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error("Error reading cache settings:", error)
    }

    return this.defaultSettings
  }

  updateSettings(settings: Partial<CacheSettings>): void {
    if (typeof window === "undefined") return

    try {
      const currentSettings = this.getSettings()
      const newSettings = { ...currentSettings, ...settings }
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings))

      if (!newSettings.enabled) {
        this.clearAll()
      }

      if (settings.maxSize && settings.maxSize < currentSettings.maxSize) {
        this.enforceMaxSize(settings.maxSize)
      }
    } catch (error) {
      console.error("Error updating cache settings:", error)
    }
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size
  }

  set(key: string, data: any, customTTL?: number): boolean {
    const settings = this.getSettings()

    if (!settings.enabled || typeof window === "undefined") {
      return false
    }

    try {
      const now = Date.now()
      const ttl = customTTL || settings.defaultTTL
      const size = this.calculateSize(data)

      const maxSizeBytes = settings.maxSize * 1024 * 1024
      if (size > maxSizeBytes) {
        console.warn("Cache item too large, skipping cache")
        return false
      }

      const cacheItem: CachedMusicData = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        size,
      }

      const cacheKey = this.getCacheKey(key)
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem))

      this.enforceMaxSize(settings.maxSize)

      return true
    } catch (error) {
      console.error("Error setting cache:", error)
      return false
    }
  }

  get(key: string): any | null {
    const settings = this.getSettings()

    if (!settings.enabled || typeof window === "undefined") {
      return null
    }

    try {
      const cacheKey = this.getCacheKey(key)
      const stored = localStorage.getItem(cacheKey)

      if (!stored) {
        return null
      }

      const cacheItem: CachedMusicData = JSON.parse(stored)
      const now = Date.now()

      if (now > cacheItem.expiresAt) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return cacheItem.data
    } catch (error) {
      console.error("Error getting cache:", error)
      return null
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") return

    try {
      const cacheKey = this.getCacheKey(key)
      localStorage.removeItem(cacheKey)
    } catch (error) {
      console.error("Error removing cache:", error)
    }
  }

  clearAll(): void {
    if (typeof window === "undefined") return

    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("Error clearing cache:", error)
    }
  }

  getStats(): CacheStats {
    if (typeof window === "undefined") {
      return { totalItems: 0, totalSize: 0, oldestItem: null, newestItem: null }
    }

    try {
      const keys = Object.keys(localStorage)
      let totalItems = 0
      let totalSize = 0
      let oldestItem: number | null = null
      let newestItem: number | null = null

      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const cacheItem: CachedMusicData = JSON.parse(stored)
              totalItems++
              totalSize += cacheItem.size

              if (oldestItem === null || cacheItem.timestamp < oldestItem) {
                oldestItem = cacheItem.timestamp
              }

              if (newestItem === null || cacheItem.timestamp > newestItem) {
                newestItem = cacheItem.timestamp
              }
            }
          } catch (error) {
            // Skip invalid cache items
          }
        }
      })

      return { totalItems, totalSize, oldestItem, newestItem }
    } catch (error) {
      console.error("Error getting cache stats:", error)
      return { totalItems: 0, totalSize: 0, oldestItem: null, newestItem: null }
    }
  }

  private enforceMaxSize(maxSizeMB: number): void {
    if (typeof window === "undefined") return

    try {
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      const stats = this.getStats()

      if (stats.totalSize <= maxSizeBytes) {
        return
      }

      const cacheItems: Array<{ key: string; timestamp: number; size: number }> = []
      const keys = Object.keys(localStorage)

      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const cacheItem: CachedMusicData = JSON.parse(stored)
              cacheItems.push({
                key,
                timestamp: cacheItem.timestamp,
                size: cacheItem.size,
              })
            }
          } catch (error) {
            localStorage.removeItem(key)
          }
        }
      })

      cacheItems.sort((a, b) => a.timestamp - b.timestamp)

      let currentSize = stats.totalSize
      for (const item of cacheItems) {
        if (currentSize <= maxSizeBytes) {
          break
        }

        localStorage.removeItem(item.key)
        currentSize -= item.size
      }
    } catch (error) {
      console.error("Error enforcing cache size:", error)
    }
  }

  cleanExpired(): void {
    if (typeof window === "undefined") return

    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()

      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const cacheItem: CachedMusicData = JSON.parse(stored)
              if (now > cacheItem.expiresAt) {
                localStorage.removeItem(key)
              }
            }
          } catch (error) {
            localStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      console.error("Error cleaning expired cache:", error)
    }
  }
}

export const musicCache = new MusicCacheManager()

export const getCacheKey = {
  trending: () => "trending_music",
  search: (query: string) => `search_${query.toLowerCase().replace(/\s+/g, "_")}`,
  playlist: (id: string) => `playlist_${id}`,
  userPlaylists: () => "user_playlists",
  likedSongs: () => "liked_songs",
}
