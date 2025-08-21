"use client"

import { useState, useCallback } from "react"
import { useListeningHistory } from "@/contexts/listening-history-context"

interface AIRecommendation {
  query: string
  reason: string
  mood: string
}

interface SmartSearchResult {
  searchQueries: string[]
  intent: string
  filters: {
    genre?: string
    mood?: string
    era?: string
    tempo?: string
  }
}

interface AIPlaylist {
  title: string
  description: string
  searchQueries: string[]
  mood: string
  estimatedDuration: string
}

export function useAIRecommendations() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getRecentTracks } = useListeningHistory()

  const generateRecommendations = useCallback(
    async (currentMood?: string, preferences?: string) => {
      try {
        setLoading(true)
        setError(null)

        const recentTracks = getRecentTracks(20)

        if (recentTracks.length === 0) {
          setError("No listening history available for recommendations")
          return
        }

        const response = await fetch("/api/ai/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listeningHistory: recentTracks,
            currentMood,
            preferences,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate recommendations")
        }

        const data = await response.json()
        setRecommendations(data.recommendations)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate recommendations")
        console.error("AI recommendations error:", err)
      } finally {
        setLoading(false)
      }
    },
    [getRecentTracks],
  )

  return { recommendations, loading, error, generateRecommendations }
}

export function useSmartSearch() {
  const [result, setResult] = useState<SmartSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enhanceSearch = useCallback(async (query: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/ai/smart-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error("Failed to enhance search")
      }

      const data = await response.json()
      setResult(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance search")
      console.error("Smart search error:", err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { result, loading, error, enhanceSearch }
}

export function useAIPlaylistGenerator() {
  const [playlist, setPlaylist] = useState<AIPlaylist | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getRecentTracks } = useListeningHistory()

  const generatePlaylist = useCallback(
    async (prompt: string, preferences?: string) => {
      try {
        setLoading(true)
        setError(null)

        const recentTracks = getRecentTracks(15)

        const response = await fetch("/api/ai/playlist-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            listeningHistory: recentTracks,
            preferences,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate playlist")
        }

        const data = await response.json()
        setPlaylist(data)
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate playlist")
        console.error("AI playlist generator error:", err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [getRecentTracks],
  )

  return { playlist, loading, error, generatePlaylist }
}
