interface CachedGenreData {
  songs: any[]
  timestamp: number
  pages: number
}

class GenreCache {
  private cache = new Map<string, CachedGenreData>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 20

  set(genreSlug: string, songs: any[], pages = 1) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(genreSlug, {
      songs,
      timestamp: Date.now(),
      pages,
    })
  }

  get(genreSlug: string): CachedGenreData | null {
    const cached = this.cache.get(genreSlug)
    if (!cached) return null

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(genreSlug)
      return null
    }

    return cached
  }

  has(genreSlug: string): boolean {
    return this.get(genreSlug) !== null
  }

  clear() {
    this.cache.clear()
  }

  // Add songs to existing cache entry
  append(genreSlug: string, newSongs: any[], newPage: number) {
    const existing = this.get(genreSlug)
    if (existing) {
      const allSongs = [...existing.songs, ...newSongs]
      this.set(genreSlug, allSongs, newPage)
    }
  }
}

export const genreCache = new GenreCache()
