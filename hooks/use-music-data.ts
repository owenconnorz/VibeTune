"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { fetchTrendingMusic, searchMusic, type Song } from "../lib/music-data"
import { musicCache, getCacheKey } from "../lib/music-cache"

const MINIMAL_FALLBACK_SONGS: Song[] = [
  {
    id: "fallback_notice",
    title: "YouTube API Quota Exceeded",
    artist: "Please try again later",
    thumbnail: "/single-music-note.png",
    duration: "0:00",
  },
]

const FALLBACK_TRENDING_SONGS: Song[] = [
  {
    id: "fallback_1",
    title: "The Look",
    artist: "Metronomy",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    duration: "3:58",
  },
  {
    id: "fallback_2",
    title: "Beautiful",
    artist: "Eminem",
    thumbnail: "/the-weeknd-blinding-lights.png",
    duration: "6:17",
  },
  {
    id: "fallback_3",
    title: "Car Yourself (Instrumental)",
    artist: "Twenty One Pilots",
    thumbnail: "/harry-styles-watermelon-sugar.png",
    duration: "3:45",
  },
  {
    id: "fallback_4",
    title: "Sucker for Pain (feat. Wiz Khalifa)",
    artist: "Imagine Dragons",
    thumbnail: "/dua-lipa-levitating.png",
    duration: "4:03",
  },
  {
    id: "fallback_5",
    title: "Shape of You",
    artist: "Ed Sheeran",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    duration: "3:53",
  },
  {
    id: "fallback_6",
    title: "Blinding Lights",
    artist: "The Weeknd",
    thumbnail: "/the-weeknd-blinding-lights.png",
    duration: "3:20",
  },
]

export function useTrendingMusic() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"cache" | "api" | "fallback">("api")

  const loadTrendingMusic = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const cacheKey = getCacheKey.trending()

      if (!forceRefresh) {
        const cachedSongs = musicCache.get(cacheKey)
        if (cachedSongs && cachedSongs.length > 0) {
          console.log("[v0] Using cached trending music:", cachedSongs.length, "songs")
          setSongs(cachedSongs)
          setSource("cache")
          setLoading(false)
          return
        }
      }

      console.log("[v0] Fetching fresh trending music from YouTube API")
      const trendingSongs = await fetchTrendingMusic(25) // Increased from default to get more results

      if (trendingSongs && trendingSongs.length > 0) {
        console.log("[v0] Got trending music from YouTube API:", trendingSongs.length, "songs")
        setSongs(trendingSongs)
        setSource("api")
        musicCache.set(cacheKey, trendingSongs, 10 * 60 * 1000) // Increased cache time to reduce API calls
      } else {
        throw new Error("No trending songs returned from YouTube API")
      }
    } catch (err) {
      console.error("[v0] YouTube API failed for trending music:", err)
      setSongs(MINIMAL_FALLBACK_SONGS) // Using minimal fallback instead of fake songs
      setSource("fallback")
      setError("YouTube API quota exceeded. Music will be available when quota resets.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrendingMusic(false) // Don't force refresh on initial load, allow cache
  }, [loadTrendingMusic])

  return { songs, loading, error, source, refetch: () => loadTrendingMusic(true) }
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

        console.log(`[v0] Searching YouTube API for: "${query}"`)
        const results = await searchMusic(query, 15) // Increased results for better search experience

        if (results && results.length > 0) {
          setSongs(results)
          setSource("api")
          musicCache.set(cacheKey, results, 30 * 60 * 1000) // Longer cache for search results
        } else {
          setSongs([])
          setSource("api")
        }
      } catch (err) {
        console.error(`[v0] YouTube API search failed for "${query}":`, err)
        setError("YouTube API quota exceeded. Search will be available when quota resets.")
        setSongs(MINIMAL_FALLBACK_SONGS) // Minimal fallback for search
        setSource("fallback")
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300) // Reduced debounce for faster search
    return () => clearTimeout(debounceTimer)
  }, [query, enabled])

  return { songs, loading, error, source }
}

export function useMoodPlaylist(queries: string[]) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"cache" | "api" | "fallback">("api")

  const memoizedQueries = useMemo(() => queries, [queries.join(",")])

  const loadMoodPlaylist = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true)
        setError(null)

        const cacheKey = `mood_playlist_${memoizedQueries.join("_").toLowerCase().replace(/\s+/g, "_")}`

        if (!forceRefresh) {
          const cachedPlaylist = musicCache.get(cacheKey)
          if (cachedPlaylist && cachedPlaylist.length > 0) {
            console.log("[v0] Using cached mood playlist:", cachedPlaylist.length, "songs")
            setSongs(cachedPlaylist)
            setSource("cache")
            setLoading(false)
            return
          }
        }

        console.log("[v0] Fetching mood playlist from API for queries:", memoizedQueries)
        const allSongs: Song[] = []
        for (const query of memoizedQueries) {
          try {
            const results = await searchMusic(query)
            if (results && results.length > 0) {
              allSongs.push(...results.slice(0, 5))
            }
          } catch (err) {
            console.warn(`[v0] Failed to search for "${query}":`, err)
          }
        }

        const uniqueSongs = allSongs
          .filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
          .slice(0, 15)

        if (uniqueSongs.length > 0) {
          console.log("[v0] Got mood playlist from API:", uniqueSongs.length, "songs")
          setSongs(uniqueSongs)
          setSource("api")
          musicCache.set(cacheKey, uniqueSongs, 3 * 60 * 1000)
        } else {
          throw new Error("No songs found for mood playlist")
        }
      } catch (err) {
        console.error("[v0] Mood playlist API failed, using fallback data:", err)
        setSongs(FALLBACK_TRENDING_SONGS.slice(0, 8))
        setSource("fallback")
        setError(null) // Don't show error to user
      } finally {
        setLoading(false)
      }
    },
    [memoizedQueries],
  )

  useEffect(() => {
    if (memoizedQueries.length > 0) {
      loadMoodPlaylist(false) // Don't force refresh on initial load
    }
  }, [loadMoodPlaylist, memoizedQueries])

  return { songs, loading, error, source, refetch: () => loadMoodPlaylist(true) }
}

export function useNewReleases() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"cache" | "api" | "fallback">("api")

  const loadNewReleases = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const cacheKey = getCacheKey.search("new_releases_2024")

      if (!forceRefresh) {
        const cachedReleases = musicCache.get(cacheKey)
        if (cachedReleases && cachedReleases.length > 0) {
          console.log("[v0] Using cached new releases:", cachedReleases.length, "songs")
          setSongs(cachedReleases)
          setSource("cache")
          setLoading(false)
          return
        }
      }

      console.log("[v0] Fetching new releases from API")
      const newReleaseQueries = [
        "new songs 2024",
        "latest releases 2024",
        "new music this week",
        "trending new songs",
        "fresh hits 2024",
        "new album releases",
      ]

      const allSongs: Song[] = []
      for (const query of newReleaseQueries) {
        try {
          const results = await searchMusic(query)
          if (results && results.length > 0) {
            allSongs.push(...results.slice(0, 4))
          }
        } catch (err) {
          console.warn(`[v0] Failed to search for new releases "${query}":`, err)
        }
      }

      const uniqueSongs = allSongs
        .filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
        .slice(0, 12)

      if (uniqueSongs.length > 0) {
        console.log("[v0] Got new releases from API:", uniqueSongs.length, "songs")
        setSongs(uniqueSongs)
        setSource("api")
        musicCache.set(cacheKey, uniqueSongs, 2 * 60 * 1000)
      } else {
        throw new Error("No new releases found")
      }
    } catch (err) {
      console.error("[v0] New releases API failed, using fallback data:", err)
      setSongs(FALLBACK_TRENDING_SONGS.slice(2, 8))
      setSource("fallback")
      setError(null) // Don't show error to user
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNewReleases(false) // Don't force refresh on initial load
  }, [loadNewReleases])

  return { songs, loading, error, source, refetch: () => loadNewReleases(true) }
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
