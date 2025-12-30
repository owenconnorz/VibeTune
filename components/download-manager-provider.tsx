"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { downloadSong, isDownloaded } from "@/lib/download-storage"
import { notificationManager } from "@/lib/notification-manager"

interface DownloadTask {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string | number
  status: "pending" | "downloading" | "completed" | "failed"
  error?: string
  retryCount?: number
}

interface DownloadManagerContextType {
  downloads: DownloadTask[]
  isDownloading: boolean
  addToQueue: (tasks: DownloadTask[]) => void
  clearCompleted: () => void
  retryFailed: () => void
  retryDownload: (id: string) => void
  getProgress: () => { completed: number; failed: number; total: number; pending: number; downloading: number }
}

const DownloadManagerContext = createContext<DownloadManagerContextType | undefined>(undefined)

const MAX_CONCURRENT_DOWNLOADS = 5
const MAX_RETRY_ATTEMPTS = 3

export function DownloadManagerProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadTask[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const processingRef = useRef(false)

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [])

  const downloadSingleSong = useCallback(async (task: DownloadTask) => {
    setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "downloading" as const } : d)))

    const alreadyDownloaded = await isDownloaded(task.id)
    if (alreadyDownloaded) {
      setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "completed" as const } : d)))
      return true
    }

    const success = await downloadSong(task.id, task.title, task.artist, task.thumbnail, task.duration)

    if (success) {
      setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "completed" as const } : d)))
      notificationManager.showDownloadCompleteNotification(task.title)
    } else {
      const retryCount = (task.retryCount || 0) + 1
      setDownloads((prev) =>
        prev.map((d) =>
          d.id === task.id
            ? {
                ...d,
                status: "failed" as const,
                error: "Download failed",
                retryCount,
              }
            : d,
        ),
      )
      notificationManager.showDownloadFailedNotification(task.title)
    }

    return success
  }, [])

  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      return
    }

    const pendingTasks = downloads.filter((d) => d.status === "pending")
    if (pendingTasks.length === 0) {
      setIsDownloading(false)
      return
    }

    processingRef.current = true
    setIsDownloading(true)

    try {
      for (let i = 0; i < pendingTasks.length; i += MAX_CONCURRENT_DOWNLOADS) {
        const batch = pendingTasks.slice(i, i + MAX_CONCURRENT_DOWNLOADS)

        await Promise.allSettled(
          batch.map(async (task) => {
            try {
              await downloadSingleSong(task)
            } catch (error) {
              console.error(`[v0] DownloadManager: Error downloading "${task.title}":`, error)
              setDownloads((prev) =>
                prev.map((d) =>
                  d.id === task.id
                    ? {
                        ...d,
                        status: "failed" as const,
                        error: error instanceof Error ? error.message : "Unknown error",
                      }
                    : d,
                ),
              )
            }
          }),
        )

        if (i + MAX_CONCURRENT_DOWNLOADS < pendingTasks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } catch (error) {
      console.error("[v0] DownloadManager: Error processing queue:", error)
    } finally {
      processingRef.current = false
      setIsDownloading(false)
    }
  }, [downloads, downloadSingleSong])

  useEffect(() => {
    const hasPending = downloads.some((d) => d.status === "pending")

    if (hasPending && !processingRef.current) {
      processQueue()
    }
  }, [downloads, processQueue])

  const addToQueue = useCallback((tasks: DownloadTask[]) => {
    setDownloads((prev) => {
      const existingIds = new Set(prev.map((d) => d.id))
      const newTasks = tasks.filter((t) => !existingIds.has(t.id))
      return [...prev, ...newTasks]
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setDownloads((prev) => prev.filter((d) => d.status !== "completed"))
  }, [])

  const retryFailed = useCallback(() => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (d.status === "failed" && (d.retryCount || 0) < MAX_RETRY_ATTEMPTS) {
          return { ...d, status: "pending" as const, error: undefined }
        }
        return d
      }),
    )
  }, [])

  const retryDownload = useCallback((id: string) => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (d.id === id && d.status === "failed" && (d.retryCount || 0) < MAX_RETRY_ATTEMPTS) {
          return { ...d, status: "pending" as const, error: undefined }
        }
        return d
      }),
    )
  }, [])

  const getProgress = useCallback(() => {
    const completed = downloads.filter((d) => d.status === "completed").length
    const failed = downloads.filter((d) => d.status === "failed").length
    const pending = downloads.filter((d) => d.status === "pending").length
    const downloading = downloads.filter((d) => d.status === "downloading").length
    const total = downloads.length
    return { completed, failed, total, pending, downloading }
  }, [downloads])

  return (
    <DownloadManagerContext.Provider
      value={{
        downloads,
        isDownloading,
        addToQueue,
        clearCompleted,
        retryFailed,
        retryDownload,
        getProgress,
      }}
    >
      {children}
    </DownloadManagerContext.Provider>
  )
}

export function useDownloadManager() {
  const context = useContext(DownloadManagerContext)
  if (!context) {
    throw new Error("useDownloadManager must be used within DownloadManagerProvider")
  }
  return context
}
