"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchTrendingMusic, searchMusic, type Song } from "@/lib/music-data"

export function useTrendingMusic() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTrendingMusic = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const trendingSongs = await fetchTrendingMusic()
      setSongs(trendingSongs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trending music")
      console.error("Error loading trending music:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrendingMusic()
  }, [loadTrendingMusic])

  return { songs, loading, error, refetch: loadTrendingMusic }
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
        const results = await searchMusic(query)
        setSongs(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed")
        console.error("Error searching music:", err)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 500)
    return () => clearTimeout(debounceTimer)
  }, [query, enabled])

  return { songs, loading, error }
}

export function useMoodPlaylist(queries: string[]) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMoodPlaylist() {
      try {
        setLoading(true)
        setError(null)

        // Search for songs using the provided queries and combine results
        const allSongs: Song[] = []
        for (const query of queries) {
          try {
            const results = await searchMusic(query)
            allSongs.push(...results.slice(0, 5)) // Take first 5 from each query
          } catch (err) {
            console.warn(`Failed to search for "${query}":`, err)
          }
        }

        // Remove duplicates and limit to 15 songs
        const uniqueSongs = allSongs
          .filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
          .slice(0, 15)

        setSongs(uniqueSongs)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load mood playlist")
        console.error("Error loading mood playlist:", err)
      } finally {
        setLoading(false)
      }
    }

    if (queries.length > 0) {
      loadMoodPlaylist()
    }
  }, [queries])

  return { songs, loading, error }
}
