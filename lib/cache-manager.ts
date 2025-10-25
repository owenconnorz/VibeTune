interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.expiresIn) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.expiresIn) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      if (age > entry.expiresIn) {
        this.cache.delete(key)
      }
    }
  }

  getSize(): number {
    return this.cache.size
  }
}

export const cacheManager = new CacheManager()

// Run cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(
    () => {
      cacheManager.cleanup()
      console.log("[v0] Cache cleanup completed. Current size:", cacheManager.getSize())
    },
    5 * 60 * 1000,
  )
}
