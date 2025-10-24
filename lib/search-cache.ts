interface CachedSearchResult {
  videos: any[]
  nextPageToken: string | null
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const searchCache = new Map<string, CachedSearchResult>()

export function getCachedSearch(query: string): CachedSearchResult | null {
  const cached = searchCache.get(query.toLowerCase())

  if (!cached) return null

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    searchCache.delete(query.toLowerCase())
    return null
  }

  return cached
}

export function setCachedSearch(query: string, videos: any[], nextPageToken: string | null) {
  searchCache.set(query.toLowerCase(), {
    videos,
    nextPageToken,
    timestamp: Date.now(),
  })

  // Limit cache size to prevent memory issues
  if (searchCache.size > 50) {
    const firstKey = searchCache.keys().next().value
    searchCache.delete(firstKey)
  }
}

export function clearSearchCache() {
  searchCache.clear()
}
