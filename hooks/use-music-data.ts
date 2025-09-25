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
  pluginId?: string
}

async function fetchTrendingMusic(maxResults = 20): Promise<Song[]> {
  console.log("[v0] Fetching trending music from YouTube Music API")

  try {
    const response = await fetch(`/api/youtube-music/trending?limit=${maxResults}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] YouTube Music API trending response:", data.tracks?.length || 0, "songs")

    if (data.success && data.tracks && data.tracks.length > 0) {
      return data.tracks.map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration?.toString() || "0:00",
        url: track.videoUrl || `https://www.youtube.com/watch?v=${track.id}`,
        audioUrl: track.audioUrl,
      }))
    }

    throw new Error(data.error || "No trending songs available")
  } catch (error) {
    console.error("[v0] YouTube Music API trending failed:", error)
    throw error
  }
}

async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  console.log("[v0] Searching YouTube Music API for:", query)

  try {
    const response = await fetch(`/api/youtube-music/search?query=${encodeURIComponent(query)}&limit=${maxResults}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] YouTube Music API search response:", data.tracks?.length || 0, "songs")

    if (data.success && data.tracks && data.tracks.length > 0) {
      return data.tracks.map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration?.toString() || "0:00",
        url: track.videoUrl || `https://www.youtube.com/watch?v=${track.id}`,
        audioUrl: track.audioUrl,
      }))
    }

    return []
  } catch (error) {
    console.error("[v0] YouTube Music API search failed:", error)
    return []
  }
}

export function useTrendingMusic() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTrendingMusic = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Loading trending music from YouTube Music API")
      const trendingSongs = await fetchTrendingMusic(25)

      console.log("[v0] Got trending music:", trendingSongs.length, "songs from YouTube Music API")
      setSongs(trendingSongs)
    } catch (err: any) {
      console.error("[v0] Trending music failed:", err)
      setError(err.message || "Failed to load trending music")
      setSongs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrendingMusic(false)
  }, [loadTrendingMusic])

  return { songs, loading, error, refetch: () => loadTrendingMusic(true) }
}

export function useSearchMusic(query: string, enabled = false) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setSongs([])
      return
    }

    async function performSearch() {
      try {
        setLoading(true)
        setError(null)

        console.log(`[v0] Searching YouTube Music API for: "${query}"`)
        const results = await searchMusic(query, 15)

        setSongs(results)
      } catch (err: any) {
        console.error(`[v0] YouTube Music API search failed for "${query}":`, err)
        setError(err.message || "Search failed")
        setSongs([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, enabled])

  return { songs, loading, error }
}

export function useMoodPlaylist(queries: string[]) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const memoizedQueries = useMemo(() => queries, [queries.join(",")])

  const loadMoodPlaylist = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true)
        setError(null)

        console.log("[v0] Fetching mood playlist from YouTube Music API for queries:", memoizedQueries)
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

        console.log("[v0] Got mood playlist:", uniqueSongs.length, "songs from YouTube Music API")
        setSongs(uniqueSongs)
      } catch (err: any) {
        console.error("[v0] Mood playlist failed:", err)
        setError(err.message || "Failed to load mood playlist")
        setSongs([])
      } finally {
        setLoading(false)
      }
    },
    [memoizedQueries],
  )

  useEffect(() => {
    if (memoizedQueries.length > 0) {
      loadMoodPlaylist(false)
    }
  }, [loadMoodPlaylist, memoizedQueries])

  return { songs, loading, error, refetch: () => loadMoodPlaylist(true) }
}

export function useNewReleases() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNewReleases = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Fetching new releases from YouTube Music API")
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

      console.log("[v0] Got new releases:", uniqueSongs.length, "songs from YouTube Music API")
      setSongs(uniqueSongs)
    } catch (err: any) {
      console.error("[v0] New releases failed:", err)
      setError(err.message || "Failed to load new releases")
      setSongs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNewReleases(false)
  }, [loadNewReleases])

  return { songs, loading, error, refetch: () => loadNewReleases(true) }
}
