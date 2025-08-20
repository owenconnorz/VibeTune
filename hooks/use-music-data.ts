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
        setSongs(cachedSongs)
        setSource("cache")
        setLoading(false)
        return
      }

      const trendingSongs = await fetchTrendingMusic()
      setSongs(trendingSongs)
      setSource("api")

      if (trendingSongs.length > 0) {
        musicCache.set(cacheKey, trendingSongs, 30 * 60 * 1000)
      }
    } catch (err) {
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
          setSongs(cachedResults)
          setSource("cache")
          setLoading(false)
          return
        }

        const results = await searchMusic(query)
        setSongs(results)
        setSource("api")

        if (results.length > 0) {
          musicCache.set(cacheKey, results, 20 * 60 * 1000)
        }
      } catch (err) {
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
          setSongs(cachedPlaylist)
          setSource("cache")
          setLoading(false)
          return
        }

        const allSongs: Song[] = []
        for (const query of queries) {
          try {
            const results = await searchMusic(query)
            allSongs.push(...results.slice(0, 5))
          } catch (err) {
            console.warn(`Failed to search for "${query}":`, err)
          }
        }

        const uniqueSongs = allSongs
          .filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
          .slice(0, 15)

        setSongs(uniqueSongs)
        setSource("api")

        if (uniqueSongs.length > 0) {
          musicCache.set(cacheKey, uniqueSongs, 15 * 60 * 1000)
        }
      } catch (err) {
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
