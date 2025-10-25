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

const MAX_CONCURRENT_DOWNLOADS = 5

export function DownloadManagerProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadTask[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const activeDownloadsRef = useRef(0)
  const processingRef = useRef(false)

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          // No need to set permission state as it's handled by notificationManager
        })
      }
    }
  }, [])

  const downloadSingleSong = useCallback(async (task: DownloadTask) => {
    console.log(`[v0] Starting download: ${task.title}`)

    // Update status to downloading
    setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "downloading" } : d)))

    // Check if already downloaded
    const alreadyDownloaded = await isDownloaded(task.id)
    if (alreadyDownloaded) {
      console.log(`[v0] Song already downloaded: ${task.title}`)
      setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "completed" } : d)))
      return true
    }

    // Download the song
    const success = await downloadSong(task.id, task.title, task.artist, task.thumbnail, task.duration)

    // Update status
    setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: success ? "completed" : "failed" } : d)))

    if (success) {
      console.log(`[v0] Successfully downloaded: ${task.title}`)
      notificationManager.showDownloadCompleteNotification(task.title)
    } else {
      console.error(`[v0] Failed to download: ${task.title}`)
      // Use notification manager for download failed notification
      notificationManager.showDownloadFailedNotification(task.title)
    }

    return success
  }, [])

  const processQueue = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true
    setIsDownloading(true)

    console.log("[v0] Starting concurrent download processing")

    const pendingTasks = downloads.filter((d) => d.status === "pending")
    if (pendingTasks.length === 0) {
      console.log("[v0] No pending downloads")
      processingRef.current = false
      setIsDownloading(false)
      return
    }

    const downloadPromises: Promise<void>[] = []
    let taskIndex = 0

    const processNextTask = async () => {
      while (taskIndex < pendingTasks.length) {
        const task = pendingTasks[taskIndex++]
        activeDownloadsRef.current++

        try {
          await downloadSingleSong(task)
        } finally {
          activeDownloadsRef.current--
        }
      }
    }

    // Start concurrent workers
    for (let i = 0; i < MAX_CONCURRENT_DOWNLOADS; i++) {
      downloadPromises.push(processNextTask())
    }

    // Wait for all downloads to complete
    await Promise.all(downloadPromises)

    console.log(`[v0] Download queue complete`)
    processingRef.current = false
    setIsDownloading(false)
  }, [downloads, downloadSingleSong])

  // Auto-process queue when new tasks are added
  useEffect(() => {
    const hasPending = downloads.some((d) => d.status === "pending")
    if (hasPending && !processingRef.current) {
      processQueue()
    }
  }, [downloads, processQueue])

  const addToQueue = useCallback((tasks: DownloadTask[]) => {
    console.log(`[v0] Adding ${tasks.length} tasks to download queue`)
    setDownloads((prev) => {
      // Avoid duplicates
      const existingIds = new Set(prev.map((d) => d.id))
      const newTasks = tasks.filter((t) => !existingIds.has(t.id))
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
