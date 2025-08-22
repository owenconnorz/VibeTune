"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"

interface DownloadContextType {
  isDownloaded: (trackId: string) => boolean
  downloadTrack: (track: any) => Promise<void>
  getOfflineAudio: (trackId: string) => string | null
  downloadedTracks: string[]
  downloadProgress: Record<string, number>
  isDownloading: (trackId: string) => boolean
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined)

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [downloadedTracks, setDownloadedTracks] = useState<string[]>([])
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    // Load downloaded tracks from localStorage
    const saved = localStorage.getItem("downloadedTracks")
    if (saved) {
      setDownloadedTracks(JSON.parse(saved))
    }
  }, [])

  const isDownloaded = useCallback(
    (trackId: string) => {
      return downloadedTracks.includes(trackId)
    },
    [downloadedTracks],
  )

  const isDownloading = useCallback(
    (trackId: string) => {
      return trackId in downloadProgress && downloadProgress[trackId] < 100
    },
    [downloadProgress],
  )

  const downloadTrack = useCallback(
    async (track: any) => {
      if (isDownloaded(track.id) || isDownloading(track.id)) return

      try {
        setDownloadProgress((prev) => ({ ...prev, [track.id]: 0 }))

        // Simulate download progress
        for (let i = 0; i <= 100; i += 10) {
          setDownloadProgress((prev) => ({ ...prev, [track.id]: i }))
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Save track data to localStorage
        const trackData = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          thumbnail: track.thumbnail,
          downloadedAt: Date.now(),
        }

        localStorage.setItem(`track_${track.id}`, JSON.stringify(trackData))

        const newDownloaded = [...downloadedTracks, track.id]
        setDownloadedTracks(newDownloaded)
        localStorage.setItem("downloadedTracks", JSON.stringify(newDownloaded))

        setDownloadProgress((prev) => {
          const { [track.id]: _, ...rest } = prev
          return rest
        })
      } catch (error) {
        console.error("Download failed:", error)
        setDownloadProgress((prev) => {
          const { [track.id]: _, ...rest } = prev
          return rest
        })
      }
    },
    [downloadedTracks, isDownloaded, isDownloading],
  )

  const getOfflineAudio = useCallback(
    (trackId: string) => {
      if (!isDownloaded(trackId)) return null
      return `offline_audio_${trackId}` // Placeholder for offline audio URL
    },
    [isDownloaded],
  )

  return (
    <DownloadContext.Provider
      value={{
        isDownloaded,
        downloadTrack,
        getOfflineAudio,
        downloadedTracks,
        downloadProgress,
        isDownloading,
      }}
    >
      {children}
    </DownloadContext.Provider>
  )
}

export function useDownload() {
  const context = useContext(DownloadContext)
  if (!context) {
    throw new Error("useDownload must be used within a DownloadProvider")
  }
  return context
}
