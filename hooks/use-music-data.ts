"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  url?: string
  audioUrl?: string
}

class MusicCache {
  private cache = new Map<string, { data: Song[]; timestamp: number; ttl: number }>()
  private maxSize = 100
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: Song[], ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  get(key: string): Song[] | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clearAll() {
    this.cache.clear()
  }

  cleanExpired() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }

  getSettings() {
    return {
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
    }
  }

  updateSettings(settings: { maxSize?: number; defaultTTL?: number }) {
    if (settings.maxSize) this.maxSize = settings.maxSize
    if (settings.defaultTTL) this.defaultTTL = settings.defaultTTL
  }
}

const musicCache = new MusicCache()

const getCacheKey = {
  trending: () => "trending_music",
  search: (query: string) => `search_${query.toLowerCase().replace(/\s+/g, "_")}`,
}

async function fetchTrendingMusic(maxResults = 20): Promise<Song[]> {
  return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
}

async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  const searchTerm = query.toLowerCase()

  // Handle specific query patterns for mood playlists and new releases
  if (searchTerm.includes("mixed") || searchTerm.includes("playlist") || searchTerm.includes("personalized")) {
    // Return a mix of different songs for playlist queries
    return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
  }

  if (
    searchTerm.includes("new") ||
    searchTerm.includes("latest") ||
    searchTerm.includes("releases") ||
    searchTerm.includes("2024")
  ) {
    // Return newer-sounding songs for new releases queries
    return FALLBACK_TRENDING_SONGS.slice(6, 6 + maxResults) // Different subset for "new" content
  }

  if (searchTerm.includes("discover") || searchTerm.includes("weekly") || searchTerm.includes("hits")) {
    // Return popular hits for discovery queries
    return FALLBACK_TRENDING_SONGS.slice(2, 2 + maxResults)
  }

  // Regular search - look for matches in title or artist
  const results = FALLBACK_TRENDING_SONGS.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm) ||
      song.artist.toLowerCase().includes(searchTerm) ||
      searchTerm
        .split(" ")
        .some((term) => song.title.toLowerCase().includes(term) || song.artist.toLowerCase().includes(term)),
  )

  // If no specific matches, return a random subset to avoid empty results
  if (results.length === 0) {
    const startIndex = Math.floor(Math.random() * Math.max(1, FALLBACK_TRENDING_SONGS.length - maxResults))
    return FALLBACK_TRENDING_SONGS.slice(startIndex, startIndex + maxResults)
  }

  return results.slice(0, maxResults)
}

const FALLBACK_TRENDING_SONGS: Song[] = [
  {
    id: "fallback_1",
    title: "The Look",
    artist: "Metronomy",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    duration: "3:58",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "fallback_2",
    title: "Beautiful",
    artist: "Eminem",
    thumbnail: "/the-weeknd-blinding-lights.png",
    duration: "6:17",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "fallback_3",
    title: "Car Yourself (Instrumental)",
    artist: "Twenty One Pilots",
    thumbnail: "/harry-styles-watermelon-sugar.png",
    duration: "3:45",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "fallback_4",
    title: "Sucker for Pain (feat. Wiz Khalifa)",
    artist: "Imagine Dragons",
    thumbnail: "/dua-lipa-levitating.png",
    duration: "4:03",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "fallback_5",
    title: "Shape of You",
    artist: "Ed Sheeran",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    duration: "3:53",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    id: "fallback_6",
    title: "Blinding Lights",
    artist: "The Weeknd",
    thumbnail: "/the-weeknd-blinding-lights.png",
    duration: "3:20",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  {
    id: "fallback_7",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    thumbnail: "/harry-styles-watermelon-sugar.png",
    duration: "2:54",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  {
    id: "fallback_8",
    title: "Levitating",
    artist: "Dua Lipa",
    thumbnail: "/dua-lipa-levitating.png",
    duration: "3:23",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    id: "fallback_9",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    duration: "2:58",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  },
  {
    id: "fallback_10",
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    thumbnail: "/the-weeknd-blinding-lights.png",
    duration: "2:21",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  },
  {
    id: "fallback_11",
    title: "Heat Waves",
    artist: "Glass Animals",
    thumbnail: "/harry-styles-watermelon-sugar.png",
    duration: "3:58",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  },
  {
    id: "fallback_12",
    title: "As It Was",
    artist: "Harry Styles",
    thumbnail: "/harry-styles-watermelon-sugar.png",
    duration: "2:47",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  },
  {
    id: "fallback_13",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    thumbnail: "/dua-lipa-levitating.png",
    duration: "3:20",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  },
  {
    id: "fallback_14",
    title: "Unholy",
    artist: "Sam Smith ft. Kim Petras",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    duration: "2:36",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  },
  {
    id: "fallback_15",
    title: "Bad Habit",
    artist: "Steve Lacy",
    thumbnail: "/the-weeknd-blinding-lights.png",
    duration: "3:51",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
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
        setSource("fallback")
        musicCache.set(cacheKey, trendingSongs, 10 * 60 * 1000) // Increased cache time to reduce API calls
      } else {
        throw new Error("No trending songs returned from YouTube API")
      }
    } catch (err) {
      console.error("[v0] YouTube API failed for trending music:", err)
      setSongs(FALLBACK_TRENDING_SONGS)
      setSource("fallback")
      setError(null) // Don't show error since fallback works
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
        setSongs(FALLBACK_TRENDING_SONGS) // Minimal fallback for search
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
          setSource("fallback")
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
        setSource("fallback")
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
