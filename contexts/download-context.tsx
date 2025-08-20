"use client"

export interface DownloadItem {
  id: string
  title: string
  artist: string
  thumbnail: string
  url: string
  status: "pending" | "downloading" | "completed" | "failed" | "paused"
  progress: number
  size?: number
  downloadedSize?: number
  createdAt: Date
  completedAt?: Date
}

export interface DownloadContextType {
  downloads: DownloadItem[]
  downloadedSongs: DownloadItem[]
  isDownloading: boolean
  downloadSong: (song: any) => Promise<void>
  pauseDownload: (id: string) => void
  resumeDownload: (id: string) => void
  cancelDownload: (id: string) => void
  deleteDownload: (id: string) => void
  clearAllDownloads: () => void
  getDownloadProgress: (id: string) => number
  isDownloaded: (id: string) => boolean
}

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

const DownloadContext = createContext<DownloadContextType | undefined>(undefined)

export const useDownload = () => {
  const context = useContext(DownloadContext)
  if (!context) {
    throw new Error("useDownload must be used within a DownloadProvider")
  }
  return context
}

export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [downloadedSongs, setDownloadedSongs] = useState<DownloadItem[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const savedDownloads = localStorage.getItem("vibetune_downloads")
    const savedDownloadedSongs = localStorage.getItem("vibetune_downloaded_songs")

    if (savedDownloads) {
      try {
        const parsed = JSON.parse(savedDownloads)
        setDownloads(
          parsed.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
          })),
        )
      } catch (error) {
        console.error("Failed to load downloads:", error)
      }
    }

    if (savedDownloadedSongs) {
      try {
        const parsed = JSON.parse(savedDownloadedSongs)
        setDownloadedSongs(
          parsed.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
          })),
        )
      } catch (error) {
        console.error("Failed to load downloaded songs:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("vibetune_downloads", JSON.stringify(downloads))
  }, [downloads])

  useEffect(() => {
    localStorage.setItem("vibetune_downloaded_songs", JSON.stringify(downloadedSongs))
  }, [downloadedSongs])

  const simulateDownload = useCallback(
    async (item: DownloadItem) => {
      const updateProgress = (progress: number) => {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === item.id
              ? {
                  ...d,
                  progress,
                  status: "downloading" as const,
                  downloadedSize: Math.floor(((item.size || 5000000) * progress) / 100),
                }
              : d,
          ),
        )
      }

      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200))

        const currentDownload = downloads.find((d) => d.id === item.id)
        if (!currentDownload || currentDownload.status === "cancelled" || currentDownload.status === "paused") {
          return
        }

        updateProgress(progress)
      }

      const completedItem = { ...item, status: "completed" as const, progress: 100, completedAt: new Date() }

      setDownloads((prev) => prev.map((d) => (d.id === item.id ? completedItem : d)))
      setDownloadedSongs((prev) => [...prev, completedItem])
    },
    [downloads],
  )

  const downloadSong = useCallback(
    async (song: any) => {
      const downloadItem: DownloadItem = {
        id: song.id || `download_${Date.now()}`,
        title: song.title || "Unknown Title",
        artist: song.artist || "Unknown Artist",
        thumbnail: song.thumbnail || "/diverse-group-making-music.png",
        url: song.url || "",
        status: "pending",
        progress: 0,
        size: Math.floor(Math.random() * 10000000) + 3000000,
        downloadedSize: 0,
        createdAt: new Date(),
      }

      setDownloads((prev) => [...prev, downloadItem])
      setIsDownloading(true)

      try {
        await simulateDownload(downloadItem)
      } catch (error) {
        console.error("Download failed:", error)
        setDownloads((prev) => prev.map((d) => (d.id === downloadItem.id ? { ...d, status: "failed" as const } : d)))
      } finally {
        setIsDownloading(false)
      }
    },
    [simulateDownload],
  )

  const pauseDownload = useCallback((id: string) => {
    setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, status: "paused" as const } : d)))
  }, [])

  const resumeDownload = useCallback(
    async (id: string) => {
      const download = downloads.find((d) => d.id === id)
      if (download) {
        setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, status: "pending" as const } : d)))
        await simulateDownload(download)
      }
    },
    [downloads, simulateDownload],
  )

  const cancelDownload = useCallback((id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const deleteDownload = useCallback((id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id))
    setDownloadedSongs((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const clearAllDownloads = useCallback(() => {
    setDownloads([])
    setDownloadedSongs([])
  }, [])

  const getDownloadProgress = useCallback(
    (id: string) => {
      const download = downloads.find((d) => d.id === id)
      return download?.progress || 0
    },
    [downloads],
  )

  const isDownloaded = useCallback(
    (id: string) => {
      return downloadedSongs.some((d) => d.id === id)
    },
    [downloadedSongs],
  )

  const value: DownloadContextType = {
    downloads,
    downloadedSongs,
    isDownloading,
    downloadSong,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
    clearAllDownloads,
    getDownloadProgress,
    isDownloaded,
  }

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>
}
