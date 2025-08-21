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
  audioData?: string // Base64 encoded audio data for offline playback
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
  getOfflineAudio: (songId: string) => Promise<string | null>
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
    const initializeDB = async () => {
      try {
        const request = indexedDB.open("VibeTuneOffline", 1)

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          console.log("[v0] Initializing IndexedDB with audioFiles object store")
          if (!db.objectStoreNames.contains("audioFiles")) {
            db.createObjectStore("audioFiles", { keyPath: "id" })
          }
        }

        request.onsuccess = () => {
          console.log("[v0] IndexedDB initialized successfully")
        }

        request.onerror = (error) => {
          console.error("[v0] Failed to initialize IndexedDB:", error)
        }
      } catch (error) {
        console.error("[v0] IndexedDB initialization error:", error)
      }
    }

    initializeDB()
  }, [])

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

      try {
        for (let progress = 0; progress <= 100; progress += 5) {
          await new Promise((resolve) => setTimeout(resolve, 100))

          const currentDownload = downloads.find((d) => d.id === item.id)
          if (!currentDownload || currentDownload.status === "cancelled" || currentDownload.status === "paused") {
            return
          }

          updateProgress(progress)
        }

        await storeOfflineAudio(item.id, item.url)

        const completedItem = {
          ...item,
          status: "completed" as const,
          progress: 100,
          completedAt: new Date(),
          audioData: `offline_${item.id}`, // Reference to offline storage
        }

        setDownloads((prev) => prev.map((d) => (d.id === item.id ? completedItem : d)))
        setDownloadedSongs((prev) => [...prev, completedItem])

        console.log("[v0] Download completed for:", item.title)
      } catch (error) {
        console.error("Download failed:", error)
        setDownloads((prev) => prev.map((d) => (d.id === item.id ? { ...d, status: "failed" as const } : d)))
      }
    },
    [downloads],
  )

  const storeOfflineAudio = async (songId: string, audioUrl: string) => {
    try {
      const request = indexedDB.open("VibeTuneOffline", 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("audioFiles")) {
          console.log("[v0] Creating audioFiles object store")
          db.createObjectStore("audioFiles", { keyPath: "id" })
        }
      }

      return new Promise((resolve, reject) => {
        request.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          if (!db.objectStoreNames.contains("audioFiles")) {
            console.error("[v0] Object store 'audioFiles' not found after initialization")
            // Try to create it if it doesn't exist
            db.close()
            const upgradeRequest = indexedDB.open("VibeTuneOffline", db.version + 1)
            upgradeRequest.onupgradeneeded = (upgradeEvent) => {
              const upgradeDb = (upgradeEvent.target as IDBOpenDBRequest).result
              if (!upgradeDb.objectStoreNames.contains("audioFiles")) {
                upgradeDb.createObjectStore("audioFiles", { keyPath: "id" })
              }
            }
            upgradeRequest.onsuccess = () => {
              console.log("[v0] Object store created successfully")
              resolve(true)
            }
            upgradeRequest.onerror = () => reject(upgradeRequest.error)
            return
          }

          const transaction = db.transaction(["audioFiles"], "readwrite")
          const store = transaction.objectStore("audioFiles")

          store.put({
            id: songId,
            audioUrl: audioUrl,
            downloadedAt: new Date(),
            audioBlob: `data:audio/mp3;base64,offline_audio_${songId}`, // Simulated offline audio
            isOffline: true,
          })

          transaction.oncomplete = () => {
            console.log("[v0] Offline audio stored for:", songId)
            resolve(true)
          }
          transaction.onerror = () => reject(transaction.error)
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Failed to store offline audio:", error)
      throw error
    }
  }

  const getOfflineAudio = useCallback(async (songId: string): Promise<string | null> => {
    try {
      const request = indexedDB.open("VibeTuneOffline", 1)

      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          if (!db.objectStoreNames.contains("audioFiles")) {
            console.log("[v0] Object store 'audioFiles' not found, returning null")
            resolve(null)
            return
          }

          const transaction = db.transaction(["audioFiles"], "readonly")
          const store = transaction.objectStore("audioFiles")
          const getRequest = store.get(songId)

          getRequest.onsuccess = () => {
            const result = getRequest.result
            if (result && result.isOffline) {
              console.log("[v0] Retrieved offline audio for:", songId)
              resolve(result.audioBlob)
            } else {
              console.log("[v0] No offline audio found for:", songId)
              resolve(null)
            }
          }

          getRequest.onerror = () => {
            console.log("[v0] Error retrieving offline audio for:", songId)
            resolve(null)
          }
        }

        request.onerror = () => {
          console.log("[v0] IndexedDB connection error")
          resolve(null)
        }
      })
    } catch (error) {
      console.error("Failed to get offline audio:", error)
      return null
    }
  }, [])

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

  const downloadSong = useCallback(
    async (song: any) => {
      const existingDownload = downloads.find((d) => d.id === song.id)
      const alreadyDownloaded = downloadedSongs.find((d) => d.id === song.id)

      if (existingDownload || alreadyDownloaded) {
        console.log("[v0] Song already downloaded or downloading:", song.id)
        return
      }

      const downloadItem: DownloadItem = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        url: song.audioUrl || `https://www.youtube.com/watch?v=${song.id}`,
        status: "pending",
        progress: 0,
        size: Math.floor(Math.random() * 5000000) + 3000000, // Random size between 3-8MB
        downloadedSize: 0,
        createdAt: new Date(),
      }

      setDownloads((prev) => [...prev, downloadItem])
      setIsDownloading(true)

      console.log("[v0] Starting download for:", song.title)
      await simulateDownload(downloadItem)
      setIsDownloading(false)
    },
    [downloads, downloadedSongs],
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
    getOfflineAudio,
  }

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>
}
