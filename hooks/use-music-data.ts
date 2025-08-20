"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchTrendingMusic, searchMusic, type Song } from "@/lib/music-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export function useTrendingMusic() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"cache" | "api" | "fallback">("api")

  const loadTrendingMusic = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const cacheKey = getCacheKey.trending()
      const cachedSongs = musicCache.get(cacheKey)

      if (cachedSongs) {
        console.log("[v0] Hook: Using cached trending music:", cachedSongs.length)
        setSongs(cachedSongs)
        setSource("cache")
        setLoading(false)
        return
      }

      console.log("[v0] Hook: Starting to load trending music from API...")
      const trendingSongs = await fetchTrendingMusic()
      console.log("[v0] Hook: Received trending songs:", trendingSongs.length)
      setSongs(trendingSongs)
      setSource("api")

      if (trendingSongs.length > 0) {
        musicCache.set(cacheKey, trendingSongs, 30 * 60 * 1000) // 30 minutes
      }
    } catch (err) {
      console.log("[v0] Hook: Error in trending music:", err)
      setError(err instanceof Error ? err.message : "Failed to load trending music")
      setSource("fallback")
      console.error("Error loading trending music:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrendingMusic()
  }, [loadTrendingMusic])

  return { songs, loading, error, source, refetch: loadTrendingMusic }
}

export function useSearchMusic(query: string, enabled = false) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"cache" | "api" | "fallback">("api")

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setSongs([])
      return
    }

    async function performSearch() {
      try {
        setLoading(true)
        setError(null)

        const cacheKey = getCacheKey.search(query)
        const cachedResults = musicCache.get(cacheKey)

        if (cachedResults) {
          console.log("[v0] Hook: Using cached search results for:", query, cachedResults.length)
          setSongs(cachedResults)
          setSource("cache")
          setLoading(false)
          return
        }

        console.log("[v0] Hook: Starting search for:", query)
        const results = await searchMusic(query)
        console.log("[v0] Hook: Search results received:", results.length)
        setSongs(results)
        setSource("api")

        if (results.length > 0) {
          musicCache.set(cacheKey, results, 20 * 60 * 1000) // 20 minutes
        }
      } catch (err) {
        console.log("[v0] Hook: Search error:", err)
        setError(err instanceof Error ? err.message : "Search failed")
        setSource("fallback")
        console.error("Error searching music:", err)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 500)
    return () => clearTimeout(debounceTimer)
  }, [query, enabled])

  return { songs, loading, error, source }
}

export function useMoodPlaylist(queries: string[]) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"cache" | "api" | "fallback">("api")

  useEffect(() => {
    async function loadMoodPlaylist() {
      try {
        setLoading(true)
        setError(null)

        const cacheKey = `mood_playlist_${queries.join("_").toLowerCase().replace(/\s+/g, "_")}`
        const cachedPlaylist = musicCache.get(cacheKey)

        if (cachedPlaylist) {
          console.log("[v0] Hook: Using cached mood playlist:", cachedPlaylist.length)
          setSongs(cachedPlaylist)
          setSource("cache")
          setLoading(false)
          return
        }

        console.log("[v0] Hook: Loading mood playlist with queries:", queries)

        // Search for songs using the provided queries and combine results
        const allSongs: Song[] = []
        for (const query of queries) {
          try {
            const results = await searchMusic(query)
            console.log("[v0] Hook: Query", query, "returned", results.length, "results")
            allSongs.push(...results.slice(0, 5)) // Take first 5 from each query
          } catch (err) {
            console.warn(`Failed to search for "${query}":`, err)
          }
        }

        // Remove duplicates and limit to 15 songs
        const uniqueSongs = allSongs
          .filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
          .slice(0, 15)

        console.log("[v0] Hook: Final mood playlist songs:", uniqueSongs.length)
        setSongs(uniqueSongs)
        setSource("api")

        if (uniqueSongs.length > 0) {
          musicCache.set(cacheKey, uniqueSongs, 15 * 60 * 1000) // 15 minutes
        }
      } catch (err) {
        console.log("[v0] Hook: Mood playlist error:", err)
        setError(err instanceof Error ? err.message : "Failed to load mood playlist")
        setSource("fallback")
        console.error("Error loading mood playlist:", err)
      } finally {
        setLoading(false)
      }
    }

    if (queries.length > 0) {
      loadMoodPlaylist()
    }
  }, [queries])

  return { songs, loading, error, source }
}

export function useCacheStats() {
  const [stats, setStats] = useState(musicCache.getStats())
  const [settings, setSettings] = useState(musicCache.getSettings())

  const refreshStats = useCallback(() => {
    setStats(musicCache.getStats())
    setSettings(musicCache.getSettings())
  }, [])

  const clearCache = useCallback(() => {
    musicCache.clearAll()
    refreshStats()
  }, [refreshStats])

  const cleanExpired = useCallback(() => {
    musicCache.cleanExpired()
    refreshStats()
  }, [refreshStats])

  const updateSettings = useCallback(
    (newSettings: Partial<typeof settings>) => {
      musicCache.updateSettings(newSettings)
      refreshStats()
    },
    [refreshStats],
  )

  return {
    stats,
    settings,
    refreshStats,
    clearCache,
    cleanExpired,
    updateSettings,
  }
}
