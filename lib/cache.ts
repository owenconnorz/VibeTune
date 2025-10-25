// Cache utilities for localStorage and memory caching

const CACHE_PREFIX = "opentune_cache_"
const CACHE_EXPIRY = 1000 * 60 * 60 // 1 hour (was 30 minutes)

interface CacheItem<T> {
  data: T
  timestamp: number
}

export const cache = {
  // Set item in localStorage with expiry
  set<T>(key: string, data: T): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
    } catch (error) {
      console.error("[v0] Cache set error:", error)
    }
  },

  // Get item from localStorage if not expired
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      if (!item) return null

      const cached: CacheItem<T> = JSON.parse(item)
      const isExpired = Date.now() - cached.timestamp > CACHE_EXPIRY

      if (isExpired) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }

      return cached.data
    } catch (error) {
      console.error("[v0] Cache get error:", error)
      return null
    }
  },

  // Remove item from localStorage
  remove(key: string): void {
    try {
      localStorage.removeItem(CACHE_PREFIX + key)
    } catch (error) {
      console.error("[v0] Cache remove error:", error)
    }
  },

  // Clear all cache
  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("[v0] Cache clear error:", error)
    }
  },
}

// Search history management
const SEARCH_HISTORY_KEY = "search_history"
const MAX_SEARCH_HISTORY = 10

export const searchHistory = {
  add(query: string): void {
    try {
      const history = this.get()
      const updated = [query, ...history.filter((q) => q !== query)].slice(0, MAX_SEARCH_HISTORY)
      localStorage.setItem(CACHE_PREFIX + SEARCH_HISTORY_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error("[v0] Search history add error:", error)
    }
  },

  get(): string[] {
    try {
      const history = localStorage.getItem(CACHE_PREFIX + SEARCH_HISTORY_KEY)
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error("[v0] Search history get error:", error)
      return []
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(CACHE_PREFIX + SEARCH_HISTORY_KEY)
    } catch (error) {
      console.error("[v0] Search history clear error:", error)
    }
  },
}
