"use client"

import { useState, useEffect } from "react"
import type { YouTubePlaylist, YouTubeVideo } from "@/lib/youtube-api"
import { useAuth } from "@/contexts/auth-context"

export function useUserPlaylists() {
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchPlaylists = async () => {
    if (!user) {
      setPlaylists([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/playlists")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch playlists")
      }

      setPlaylists(data.playlists)
    } catch (err) {
      console.error("Error fetching playlists:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch playlists")
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylists()
  }, [user])

  return {
    playlists,
    loading,
    error,
    refetch: fetchPlaylists,
  }
}

export function useLikedSongs() {
  const [songs, setSongs] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchLikedSongs = async () => {
    if (!user) {
      setSongs([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/liked-songs")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch liked songs")
      }

      setSongs(data.songs)
    } catch (err) {
      console.error("Error fetching liked songs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch liked songs")
      setSongs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLikedSongs()
  }, [user])

  return {
    songs,
    loading,
    error,
    refetch: fetchLikedSongs,
  }
}
