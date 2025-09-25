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

async function fetchTrendingMusic(maxResults = 20): Promise<Song[]> {
  console.log("[v0] Fetching trending music from NewPipe API")
  const response = await fetch(`/api/newpipe/trending?maxResults=${maxResults}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  console.log("[v0] NewPipe API trending response:", data.source, data.songs?.length || 0, "songs")

  if (data.songs && data.songs.length > 0) {
    return data.songs.map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
      url: song.url,
      audioUrl: song.audioUrl,
    }))
  }

  throw new Error(data.error || "No trending songs available")
}

async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  console.log("[v0] Searching NewPipe API for:", query)
  const response = await fetch(`/api/newpipe/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  console.log("[v0] NewPipe API search response:", data.source, data.songs?.length || 0, "songs")

  if (data.songs && data.songs.length > 0) {
    return data.songs.map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
      url: song.url,
      audioUrl: song.audioUrl,
    }))
  }

  return []
}

export function useTrendingMusic() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTrendingMusic = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Loading trending music from NewPipe API")
      const trendingSongs = await fetchTrendingMusic(25)

      console.log("[v0] Got trending music:", trendingSongs.length, "songs from NewPipe API")
      setSongs(trendingSongs)
    } catch (err) {
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

        console.log(`[v0] Searching NewPipe API for: "${query}"`)
        const results = await searchMusic(query, 15)

        setSongs(results)
      } catch (err) {
        console.error(`[v0] NewPipe API search failed for "${query}":`, err)
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

        console.log("[v0] Fetching mood playlist from NewPipe API for queries:", memoizedQueries)
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

        console.log("[v0] Got mood playlist:", uniqueSongs.length, "songs from NewPipe API")
        setSongs(uniqueSongs)
      } catch (err) {
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

      console.log("[v0] Fetching new releases from NewPipe API")
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

      console.log("[v0] Got new releases:", uniqueSongs.length, "songs from NewPipe API")
      setSongs(uniqueSongs)
    } catch (err) {
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
