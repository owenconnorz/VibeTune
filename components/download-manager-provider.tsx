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
}

interface DownloadManagerContextType {
  downloads: DownloadTask[]
  isDownloading: boolean
  addToQueue: (tasks: DownloadTask[]) => void
  clearCompleted: () => void
  getProgress: () => { completed: number; failed: number; total: number }
}

const DownloadManagerContext = createContext<DownloadManagerContextType | undefined>(undefined)

const MAX_CONCURRENT_DOWNLOADS = 3 // Reduced from 5 to 3 for better stability

export function DownloadManagerProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadTask[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const activeDownloadsRef = useRef(0)
  const processingRef = useRef(false)

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [])

  const downloadSingleSong = useCallback(async (task: DownloadTask) => {
    console.log(`[v0] DownloadManager: Starting download for "${task.title}"`)

    setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "downloading" as const } : d)))

    const alreadyDownloaded = await isDownloaded(task.id)
    if (alreadyDownloaded) {
      console.log(`[v0] DownloadManager: Song already downloaded: "${task.title}"`)
      setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "completed" as const } : d)))
      return true
    }

    console.log(`[v0] DownloadManager: Calling downloadSong for "${task.title}"`)
    const success = await downloadSong(task.id, task.title, task.artist, task.thumbnail, task.duration)

    setDownloads((prev) =>
      prev.map((d) => (d.id === task.id ? { ...d, status: (success ? "completed" : "failed") as const } : d)),
    )

    if (success) {
      console.log(`[v0] DownloadManager: Successfully downloaded "${task.title}"`)
      notificationManager.showDownloadCompleteNotification(task.title)
    } else {
      console.error(`[v0] DownloadManager: Failed to download "${task.title}"`)
      notificationManager.showDownloadFailedNotification(task.title)
    }

    return success
  }, [])

  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      console.log("[v0] DownloadManager: Already processing queue, skipping")
      return
    }

    const pendingTasks = downloads.filter((d) => d.status === "pending")
    if (pendingTasks.length === 0) {
      console.log("[v0] DownloadManager: No pending downloads")
      setIsDownloading(false)
      return
    }

    processingRef.current = true
    setIsDownloading(true)

    console.log(`[v0] DownloadManager: Starting to process ${pendingTasks.length} pending downloads`)
    console.log(`[v0] DownloadManager: Using ${MAX_CONCURRENT_DOWNLOADS} concurrent workers`)

    try {
      for (let i = 0; i < pendingTasks.length; i += MAX_CONCURRENT_DOWNLOADS) {
        const batch = pendingTasks.slice(i, i + MAX_CONCURRENT_DOWNLOADS)
        console.log(
          `[v0] DownloadManager: Processing batch ${Math.floor(i / MAX_CONCURRENT_DOWNLOADS) + 1} with ${batch.length} songs`,
        )

        await Promise.all(
          batch.map(async (task) => {
            try {
              await downloadSingleSong(task)
            } catch (error) {
              console.error(`[v0] DownloadManager: Error downloading "${task.title}":`, error)
              setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "failed" as const } : d)))
            }
          }),
        )
      }

      console.log("[v0] DownloadManager: All downloads completed")
    } catch (error) {
      console.error("[v0] DownloadManager: Error processing queue:", error)
    } finally {
      processingRef.current = false
      setIsDownloading(false)
    }
  }, [downloads, downloadSingleSong])

  useEffect(() => {
    const hasPending = downloads.some((d) => d.status === "pending")
    console.log(
      `[v0] DownloadManager: Downloads changed. Has pending: ${hasPending}, Processing: ${processingRef.current}`,
    )

    if (hasPending && !processingRef.current) {
      console.log("[v0] DownloadManager: Triggering processQueue")
      processQueue()
    }
  }, [downloads, processQueue])

  const addToQueue = useCallback((tasks: DownloadTask[]) => {
    console.log(`[v0] DownloadManager: Adding ${tasks.length} tasks to download queue`)
    console.log(
      "[v0] DownloadManager: Tasks:",
      tasks.map((t) => t.title),
    )

    setDownloads((prev) => {
      const existingIds = new Set(prev.map((d) => d.id))
      const newTasks = tasks.filter((t) => !existingIds.has(t.id))
      console.log(
        `[v0] DownloadManager: ${newTasks.length} new tasks (${tasks.length - newTasks.length} duplicates filtered)`,
      )
      return [...prev, ...newTasks]
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setDownloads((prev) => prev.filter((d) => d.status !== "completed"))
  }, [])

  const getProgress = useCallback(() => {
    const completed = downloads.filter((d) => d.status === "completed").length
    const failed = downloads.filter((d) => d.status === "failed").length
    const total = downloads.length
    return { completed, failed, total }
  }, [downloads])

  return (
    <DownloadManagerContext.Provider
      value={{
        downloads,
        isDownloading,
        addToQueue,
        clearCompleted,
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
