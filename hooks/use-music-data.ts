"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createMusicAPI, fallbackMusicData, type PipedVideo } from "../lib/piped-api"

export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  url?: string
  audioUrl?: string
}

const musicAPI = createMusicAPI()

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

function getFallbackSongs(): Song[] {
  return fallbackMusicData.map(convertPipedVideoToSong)
}

async function fetchTrendingMusic(maxResults = 20): Promise<Song[]> {
  console.log("[v0] Fetching trending music from Piped API")
  try {
    const result = await musicAPI.getTrending(maxResults)
    const songs = result.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      duration: track.duration,
      url: track.url,
      audioUrl: track.audioUrl,
    }))
    console.log("[v0] Successfully fetched", songs.length, "trending songs from Piped API")
    return songs
  } catch (error) {
    console.error("[v0] Piped API trending failed:", error)
    console.log("[v0] Using fallback trending music data")
    return getFallbackSongs().slice(0, maxResults)
  }
}

async function searchMusic(query: string, maxResults = 10): Promise<Song[]> {
  console.log("[v0] Searching Piped API for:", query)
  try {
    const result = await musicAPI.search(query, maxResults)
    const songs = result.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      duration: track.duration,
      url: track.url,
      audioUrl: track.audioUrl,
    }))
    console.log("[v0] Successfully found", songs.length, "songs for query:", query)
    return songs
  } catch (error) {
    console.error("[v0] Piped API search failed for query:", query, error)
    console.log("[v0] Using fallback music data for search")
    return getFallbackSongs().slice(0, maxResults)
  }
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

      console.log("[v0] Loading trending music from Piped API")
      const trendingSongs = await fetchTrendingMusic(25)

      if (trendingSongs && trendingSongs.length > 0) {
        const isUsingFallback = trendingSongs.some((song) => song.audioUrl?.includes("soundhelix.com"))
        console.log(
          "[v0] Got trending music:",
          trendingSongs.length,
          "songs",
          isUsingFallback ? "(fallback data)" : "(Piped API)",
        )
        setSongs(trendingSongs)
        setSource(isUsingFallback ? "fallback" : "api")
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
  const [source, setSource] = useState<"api" | "fallback">("api")

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
          const isUsingFallback = uniqueSongs.some((song) => song.audioUrl?.includes("soundhelix.com"))
          console.log(
            "[v0] Got mood playlist:",
            uniqueSongs.length,
            "songs",
            isUsingFallback ? "(fallback data)" : "(Piped API)",
          )
          setSongs(uniqueSongs)
          setSource(isUsingFallback ? "fallback" : "api")
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
        const isUsingFallback = uniqueSongs.some((song) => song.audioUrl?.includes("soundhelix.com"))
        console.log(
          "[v0] Got new releases:",
          uniqueSongs.length,
          "songs",
          isUsingFallback ? "(fallback data)" : "(Piped API)",
        )
        setSongs(uniqueSongs)
        setSource(isUsingFallback ? "fallback" : "api")
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
