"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createPipedAPI, type PipedVideo } from "../lib/piped-api"

export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  url?: string
  audioUrl?: string
}

const pipedAPI = createPipedAPI()

function convertPipedVideoToSong(video: PipedVideo): Song {
  return {
    id: video.id,
    title: video.title,
    artist: video.artist,
    thumbnail: video.thumbnail,
    duration: video.duration,
    url: video.url,
    audioUrl: video.audioUrl,
  }
}

async function fetchTrendingMusic(maxResults = 20): Promise<Song[]> {
  console.log("[v0] Fetching trending music from Piped API")
  try {
    const result = await pipedAPI.getTrending(maxResults)
    const songs = result.videos.map(convertPipedVideoToSong)
    console.log("[v0] Successfully fetched", songs.length, "trending songs from Piped API")
    return songs
  } catch (error) {
    console.error("[v0] Piped API trending failed:", error)
    throw error
  }
}

async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  console.log("[v0] Searching Piped API for:", query)
  try {
    const result = await pipedAPI.search(query, maxResults)
    const songs = result.videos.map(convertPipedVideoToSong)
    console.log("[v0] Successfully found", songs.length, "songs for query:", query)
    return songs
  } catch (error) {
    console.error("[v0] Piped API search failed for query:", query, error)
    throw error
  }
}

export function useTrendingMusic() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"api" | "error">("api")

  const loadTrendingMusic = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Loading trending music from Piped API")
      const trendingSongs = await fetchTrendingMusic(25)

      if (trendingSongs && trendingSongs.length > 0) {
        console.log("[v0] Got trending music from Piped API:", trendingSongs.length, "songs")
        setSongs(trendingSongs)
        setSource("api")
      } else {
        throw new Error("No trending songs returned from Piped API")
      }
    } catch (err) {
      console.error("[v0] Piped API failed for trending music:", err)
      setError("Failed to load trending music from Piped API")
      setSongs([])
      setSource("error")
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
  const [source, setSource] = useState<"api" | "error">("api")

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setSongs([])
      return
    }

    async function performSearch() {
      try {
        setLoading(true)
        setError(null)

        console.log(`[v0] Searching Piped API for: "${query}"`)
        const results = await searchMusic(query, 15)

        if (results && results.length > 0) {
          setSongs(results)
          setSource("api")
        } else {
          setSongs([])
          setSource("api")
        }
      } catch (err) {
        console.error(`[v0] Piped API search failed for "${query}":`, err)
        setError("Piped API search failed. Please try again.")
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
  const [source, setSource] = useState<"api" | "error">("api")

  const memoizedQueries = useMemo(() => queries, [queries.join(",")])

  const loadMoodPlaylist = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true)
        setError(null)

        console.log("[v0] Fetching mood playlist from Piped API for queries:", memoizedQueries)
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
          console.log("[v0] Got mood playlist from Piped API:", uniqueSongs.length, "songs")
          setSongs(uniqueSongs)
          setSource("api")
        } else {
          throw new Error("No songs found for mood playlist")
        }
      } catch (err) {
        console.error("[v0] Mood playlist API failed:", err)
        setError("Failed to load mood playlist from Piped API")
        setSongs([])
        setSource("error")
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
  const [source, setSource] = useState<"api" | "error">("api")

  const loadNewReleases = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Fetching new releases from Piped API")
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
        console.log("[v0] Got new releases from Piped API:", uniqueSongs.length, "songs")
        setSongs(uniqueSongs)
        setSource("api")
      } else {
        throw new Error("No new releases found")
      }
    } catch (err) {
      console.error("[v0] New releases API failed:", err)
      setError("Failed to load new releases from Piped API")
      setSongs([])
      setSource("error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNewReleases(false)
  }, [loadNewReleases])

  return { songs, loading, error, source, refetch: () => loadNewReleases(true) }
}
