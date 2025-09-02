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
  console.log("[v0] Fetching trending music from server-side Piped API")
  try {
    const response = await fetch(`/api/piped/trending?maxResults=${maxResults}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Server-side Piped API trending response:", data.source, data.songs?.length || 0, "songs")

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

    return getFallbackSongs().slice(0, maxResults)
  } catch (error) {
    console.error("[v0] Server-side Piped API trending failed:", error)
    console.log("[v0] Using fallback trending music data")
    return getFallbackSongs().slice(0, maxResults)
  }
}

async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  console.log("[v0] Searching server-side Piped API for:", query)
  try {
    const response = await fetch(`/api/piped/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Server-side Piped API search response:", data.source, data.songs?.length || 0, "songs")

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

    return getFallbackSongs().slice(0, maxResults)
  } catch (error) {
    console.error("[v0] Server-side Piped API search failed for query:", query, error)
    console.log("[v0] Using fallback music data for search")
    return getFallbackSongs().slice(0, maxResults)
  }
}

function getFallbackSongs(): Song[] {
  return [
    {
      id: "fallback-1",
      title: "Shape of You",
      artist: "Ed Sheeran",
      duration: "3:53",
      thumbnail: "/ed-sheeran-shape-of-you.png",
      url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
      audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "fallback-2",
      title: "Blinding Lights",
      artist: "The Weeknd",
      duration: "3:20",
      thumbnail: "/weeknd-blinding-lights.png",
      url: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
      audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "fallback-3",
      title: "Anti-Hero",
      artist: "Taylor Swift",
      duration: "3:20",
      thumbnail: "/taylor-swift-anti-hero.png",
      url: "https://www.youtube.com/watch?v=b1kbLWvqugk",
      audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
      id: "fallback-4",
      title: "As It Was",
      artist: "Harry Styles",
      duration: "2:47",
      thumbnail: "/harry-styles-as-it-was.png",
      url: "https://www.youtube.com/watch?v=H5v3kku4y6Q",
      audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
    {
      id: "fallback-5",
      title: "Bad Habit",
      artist: "Steve Lacy",
      duration: "3:51",
      thumbnail: "/steve-lacy-bad-habit.png",
      url: "https://www.youtube.com/watch?v=VF-r5TtlT9w",
      audioUrl: "https://soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    },
  ]
}

export function useTrendingMusic() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"api" | "fallback">("api")

  const loadTrendingMusic = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Loading trending music from server-side Piped API")
      const trendingSongs = await fetchTrendingMusic(25)

      if (trendingSongs && trendingSongs.length > 0) {
        const isUsingFallback = trendingSongs.some((song) => song.audioUrl?.includes("soundhelix.com"))
        console.log(
          "[v0] Got trending music:",
          trendingSongs.length,
          "songs",
          isUsingFallback ? "(fallback data)" : "(server-side Piped API)",
        )
        setSongs(trendingSongs)
        setSource(isUsingFallback ? "fallback" : "server-side Piped API")
      } else {
        const fallbackSongs = getFallbackSongs()
        setSongs(fallbackSongs)
        setSource("fallback")
        console.log("[v0] Using fallback trending music:", fallbackSongs.length, "songs")
      }
    } catch (err) {
      console.error("[v0] Trending music failed:", err)
      const fallbackSongs = getFallbackSongs()
      setSongs(fallbackSongs)
      setSource("fallback")
      setError(null) // Clear error since we have fallback data
      console.log("[v0] Using fallback trending music after error:", fallbackSongs.length, "songs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrendingMusic(false)
  }, [loadTrendingMusic])

  return { songs, loading, error, source, refetch: () => loadTrendingMusic(true) }
}

export function useSearchMusic(query: string, enabled = false) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"api" | "fallback">("api")

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setSongs([])
      return
    }

    async function performSearch() {
      try {
        setLoading(true)
        setError(null)

        console.log(`[v0] Searching server-side Piped API for: "${query}"`)
        const results = await searchMusic(query, 15)

        if (results && results.length > 0) {
          setSongs(results)
          setSource("server-side Piped API")
        } else {
          setSongs([])
          setSource("server-side Piped API")
        }
      } catch (err) {
        console.error(`[v0] Server-side Piped API search failed for "${query}":`, err)
        setError("Server-side Piped API search failed. Please try again.")
        setSongs([])
        setSource("error")
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, enabled])

  return { songs, loading, error, source }
}

export function useMoodPlaylist(queries: string[]) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"api" | "fallback">("api")

  const memoizedQueries = useMemo(() => queries, [queries.join(",")])

  const loadMoodPlaylist = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true)
        setError(null)

        console.log("[v0] Fetching mood playlist from server-side Piped API for queries:", memoizedQueries)
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
          const isUsingFallback = uniqueSongs.some((song) => song.audioUrl?.includes("soundhelix.com"))
          console.log(
            "[v0] Got mood playlist:",
            uniqueSongs.length,
            "songs",
            isUsingFallback ? "(fallback data)" : "(server-side Piped API)",
          )
          setSongs(uniqueSongs)
          setSource(isUsingFallback ? "fallback" : "server-side Piped API")
        } else {
          const fallbackSongs = getFallbackSongs().slice(0, 15)
          setSongs(fallbackSongs)
          setSource("fallback")
          console.log("[v0] Using fallback mood playlist:", fallbackSongs.length, "songs")
        }
      } catch (err) {
        console.error("[v0] Mood playlist failed:", err)
        const fallbackSongs = getFallbackSongs().slice(0, 15)
        setSongs(fallbackSongs)
        setSource("fallback")
        setError(null) // Clear error since we have fallback data
        console.log("[v0] Using fallback mood playlist after error:", fallbackSongs.length, "songs")
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

  return { songs, loading, error, source, refetch: () => loadMoodPlaylist(true) }
}

export function useNewReleases() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"api" | "fallback">("api")

  const loadNewReleases = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Fetching new releases from server-side Piped API")
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
        const isUsingFallback = uniqueSongs.some((song) => song.audioUrl?.includes("soundhelix.com"))
        console.log(
          "[v0] Got new releases:",
          uniqueSongs.length,
          "songs",
          isUsingFallback ? "(fallback data)" : "(server-side Piped API)",
        )
        setSongs(uniqueSongs)
        setSource(isUsingFallback ? "fallback" : "server-side Piped API")
      } else {
        const fallbackSongs = getFallbackSongs().slice(0, 12)
        setSongs(fallbackSongs)
        setSource("fallback")
        console.log("[v0] Using fallback new releases:", fallbackSongs.length, "songs")
      }
    } catch (err) {
      console.error("[v0] New releases failed:", err)
      const fallbackSongs = getFallbackSongs().slice(0, 12)
      setSongs(fallbackSongs)
      setSource("fallback")
      setError(null) // Clear error since we have fallback data
      console.log("[v0] Using fallback new releases after error:", fallbackSongs.length, "songs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNewReleases(false)
  }, [loadNewReleases])

  return { songs, loading, error, source, refetch: () => loadNewReleases(true) }
}
