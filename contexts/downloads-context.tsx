"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  audioUrl?: string
  videoUrl?: string
  isVideo?: boolean
}

interface DownloadsContextType {
  downloads: Track[]
  addToDownloads: (track: Track) => void
  removeFromDownloads: (trackId: string) => void
  isDownloaded: (trackId: string) => boolean
  clearDownloads: () => void
}

const DownloadsContext = createContext<DownloadsContextType | undefined>(undefined)

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<Track[]>([])

  // Load downloads from localStorage on mount
  useEffect(() => {
    try {
      const savedDownloads = localStorage.getItem("vibetuneDownloads")
      if (savedDownloads) {
        setDownloads(JSON.parse(savedDownloads))
      }
    } catch (error) {
      console.error("Failed to load downloads from localStorage:", error)
    }
  }, [])

  // Save downloads to localStorage whenever downloads change
  useEffect(() => {
    try {
      localStorage.setItem("vibetuneDownloads", JSON.stringify(downloads))
    } catch (error) {
      console.error("Failed to save downloads to localStorage:", error)
    }
  }, [downloads])

  const addToDownloads = (track: Track) => {
    setDownloads((prev) => {
      // Check if track is already downloaded
      if (prev.some((t) => t.id === track.id)) {
        return prev
      }
      return [...prev, track]
    })
  }

  const removeFromDownloads = (trackId: string) => {
    setDownloads((prev) => prev.filter((track) => track.id !== trackId))
  }

  const isDownloaded = (trackId: string) => {
    return downloads.some((track) => track.id === trackId)
  }

  const clearDownloads = () => {
    setDownloads([])
  }

  return (
    <DownloadsContext.Provider
      value={{
        downloads,
        addToDownloads,
        removeFromDownloads,
        isDownloaded,
        clearDownloads,
      }}
    >
      {children}
    </DownloadsContext.Provider>
  )
}

export function useDownloads() {
  const context = useContext(DownloadsContext)
  if (context === undefined) {
    throw new Error("useDownloads must be used within a DownloadsProvider")
  }
  return context
}
