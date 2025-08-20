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
  private readonly CACHE_PREFIX = "opentune_music_"
  private readonly SETTINGS_KEY = "opentune_cache_settings"

  private defaultSettings: CacheSettings = {
    maxSize: 50, // 50MB default
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    enabled: true,
  }

  // Get cache settings
  getSettings(): CacheSettings {
    if (typeof window === "undefined") return this.defaultSettings

    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY)
      if (stored) {
        return { ...this.defaultSettings, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error("[v0] Error reading cache settings:", error)
    }

    return this.defaultSettings
  }

  // Update cache settings
  updateSettings(settings: Partial<CacheSettings>): void {
    if (typeof window === "undefined") return

    try {
      const currentSettings = this.getSettings()
      const newSettings = { ...currentSettings, ...settings }
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings))

      // If cache was disabled, clear all cached data
      if (!newSettings.enabled) {
        this.clearAll()
      }

      // If max size was reduced, enforce new limit
      if (settings.maxSize && settings.maxSize < currentSettings.maxSize) {
        this.enforceMaxSize(settings.maxSize)
      }
    } catch (error) {
      console.error("[v0] Error updating cache settings:", error)
    }
  }

  // Generate cache key
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`
  }

  // Calculate data size in bytes
  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size
  }

  // Set cache item
  set(key: string, data: any, customTTL?: number): boolean {
    const settings = this.getSettings()

    if (!settings.enabled || typeof window === "undefined") {
      return false
    }

    try {
      const now = Date.now()
      const ttl = customTTL || settings.defaultTTL
      const size = this.calculateSize(data)

      // Check if this single item exceeds max cache size
      const maxSizeBytes = settings.maxSize * 1024 * 1024
      if (size > maxSizeBytes) {
        console.warn("[v0] Cache item too large, skipping cache")
        return false
      }

      const cacheItem: CachedMusicData = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        size,
      }

      // Store the item
      const cacheKey = this.getCacheKey(key)
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem))

      // Enforce cache size limits
      this.enforceMaxSize(settings.maxSize)

      console.log(`[v0] Cached music data: ${key} (${(size / 1024).toFixed(1)}KB)`)
      return true
    } catch (error) {
      console.error("[v0] Error setting cache:", error)
      return false
    }
  }

  // Get cache item
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

      // Check if expired
      if (now > cacheItem.expiresAt) {
        localStorage.removeItem(cacheKey)
        console.log(`[v0] Cache expired for: ${key}`)
        return null
      }

      console.log(`[v0] Cache hit for: ${key}`)
      return cacheItem.data
    } catch (error) {
      console.error("[v0] Error getting cache:", error)
      return null
    }
  }

  // Remove specific cache item
  remove(key: string): void {
    if (typeof window === "undefined") return

    try {
      const cacheKey = this.getCacheKey(key)
      localStorage.removeItem(cacheKey)
      console.log(`[v0] Removed from cache: ${key}`)
    } catch (error) {
      console.error("[v0] Error removing cache:", error)
    }
  }

  // Clear all cached music data
  clearAll(): void {
    if (typeof window === "undefined") return

    try {
      const keys = Object.keys(localStorage)
      let removedCount = 0

      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key)
          removedCount++
        }
      })

      console.log(`[v0] Cleared ${removedCount} cached music items`)
    } catch (error) {
      console.error("[v0] Error clearing cache:", error)
    }
  }

  // Get cache statistics
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
      console.error("[v0] Error getting cache stats:", error)
      return { totalItems: 0, totalSize: 0, oldestItem: null, newestItem: null }
    }
  }

  // Enforce maximum cache size by removing oldest items
  private enforceMaxSize(maxSizeMB: number): void {
    if (typeof window === "undefined") return

    try {
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      const stats = this.getStats()

      if (stats.totalSize <= maxSizeBytes) {
        return // Within limits
      }

      console.log(
        `[v0] Cache size (${(stats.totalSize / 1024 / 1024).toFixed(1)}MB) exceeds limit (${maxSizeMB}MB), cleaning up...`,
      )

      // Get all cache items with timestamps
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
            // Remove invalid items
            localStorage.removeItem(key)
          }
        }
      })

      // Sort by timestamp (oldest first)
      cacheItems.sort((a, b) => a.timestamp - b.timestamp)

      // Remove oldest items until under size limit
      let currentSize = stats.totalSize
      let removedCount = 0

      for (const item of cacheItems) {
        if (currentSize <= maxSizeBytes) {
          break
        }

        localStorage.removeItem(item.key)
        currentSize -= item.size
        removedCount++
      }

      console.log(`[v0] Removed ${removedCount} old cache items to enforce size limit`)
    } catch (error) {
      console.error("[v0] Error enforcing cache size:", error)
    }
  }

  // Clean expired items
  cleanExpired(): void {
    if (typeof window === "undefined") return

    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()
      let removedCount = 0

      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const cacheItem: CachedMusicData = JSON.parse(stored)
              if (now > cacheItem.expiresAt) {
                localStorage.removeItem(key)
                removedCount++
              }
            }
          } catch (error) {
            // Remove invalid items
            localStorage.removeItem(key)
            removedCount++
          }
        }
      })

      if (removedCount > 0) {
        console.log(`[v0] Cleaned ${removedCount} expired cache items`)
      }
    } catch (error) {
      console.error("[v0] Error cleaning expired cache:", error)
    }
  }
}

// Export singleton instance
export const musicCache = new MusicCacheManager()

// Helper functions for common cache keys
export const getCacheKey = {
  trending: () => "trending_music",
  search: (query: string) => `search_${query.toLowerCase().replace(/\s+/g, "_")}`,
  playlist: (id: string) => `playlist_${id}`,
  userPlaylists: () => "user_playlists",
  likedSongs: () => "liked_songs",
}
