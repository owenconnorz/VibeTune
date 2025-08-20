"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Track } from "./audio-player-context"

export interface HistoryTrack extends Track {
  playedAt: string
  playCount: number
}

interface ListeningHistoryContextType {
  history: HistoryTrack[]
  addToHistory: (track: Track) => void
  clearHistory: () => void
  getRecentTracks: (limit?: number) => HistoryTrack[]
}

const ListeningHistoryContext = createContext<ListeningHistoryContextType | undefined>(undefined)

const HISTORY_STORAGE_KEY = "opentune-listening-history"
const MAX_HISTORY_ITEMS = 100

export function ListeningHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryTrack[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error("Error loading listening history:", error)
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  }, [history])

  const addToHistory = (track: Track) => {
    // Skip sample/fallback tracks
    if (track.id.startsWith("default") || track.id.length < 10) {
      return
    }

    setHistory((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === track.id)
      const now = new Date().toISOString()

      if (existingIndex >= 0) {
        // Update existing track - move to front and increment play count
        const existingTrack = prev[existingIndex]
        const updatedTrack = {
          ...existingTrack,
          playedAt: now,
          playCount: existingTrack.playCount + 1,
        }

        return [updatedTrack, ...prev.slice(0, existingIndex), ...prev.slice(existingIndex + 1)]
      } else {
        // Add new track to front
        const newTrack: HistoryTrack = {
          ...track,
          playedAt: now,
          playCount: 1,
        }

        return [newTrack, ...prev].slice(0, MAX_HISTORY_ITEMS)
      }
    })
  }

  const clearHistory = () => {
    setHistory([])
  }

  const getRecentTracks = (limit = 10): HistoryTrack[] => {
    return history.slice(0, limit)
  }

  return (
    <ListeningHistoryContext.Provider
      value={{
        history,
        addToHistory,
        clearHistory,
        getRecentTracks,
      }}
    >
      {children}
    </ListeningHistoryContext.Provider>
  )
}

export function useListeningHistory() {
  const context = useContext(ListeningHistoryContext)
  if (context === undefined) {
    throw new Error("useListeningHistory must be used within a ListeningHistoryProvider")
  }
  return context
}
