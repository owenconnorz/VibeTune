"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { downloadSong, isDownloaded } from "@/lib/download-storage"

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

export function DownloadManagerProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadTask[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const processingRef = useRef(false)

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [])

  // Show notification helper
  const showNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if (notificationPermission === "granted" && "Notification" in window) {
        try {
          new Notification(title, {
            body,
            icon: icon || "/icon-192x192.png",
            badge: "/icon-192x192.png",
            tag: "opentune-download",
          })
        } catch (error) {
          console.error("[v0] Failed to show notification:", error)
        }
      }
    },
    [notificationPermission],
  )

  // Process download queue
  const processQueue = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true
    setIsDownloading(true)

    console.log("[v0] Starting download queue processing")

    const pendingTasks = downloads.filter((d) => d.status === "pending")
    if (pendingTasks.length === 0) {
      console.log("[v0] No pending downloads")
      processingRef.current = false
      setIsDownloading(false)
      return
    }

    // Show start notification
    showNotification(
      "Download Started",
      `Downloading ${pendingTasks.length} song${pendingTasks.length > 1 ? "s" : ""}...`,
    )

    for (const task of pendingTasks) {
      console.log(`[v0] Processing download: ${task.title}`)

      // Update status to downloading
      setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "downloading" } : d)))

      // Check if already downloaded
      const alreadyDownloaded = await isDownloaded(task.id)
      if (alreadyDownloaded) {
        console.log(`[v0] Song already downloaded: ${task.title}`)
        setDownloads((prev) => prev.map((d) => (d.id === task.id ? { ...d, status: "completed" } : d)))
        continue
      }

      // Download the song
      const success = await downloadSong(task.id, task.title, task.artist, task.thumbnail, task.duration)

      // Update status
      setDownloads((prev) =>
        prev.map((d) => (d.id === task.id ? { ...d, status: success ? "completed" : "failed" } : d)),
      )

      if (success) {
        console.log(`[v0] Successfully downloaded: ${task.title}`)
      } else {
        console.error(`[v0] Failed to download: ${task.title}`)
        showNotification("Download Failed", `Failed to download "${task.title}"`)
      }

      // Small delay between downloads to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Show completion notification
    const completed = downloads.filter((d) => d.status === "completed").length
    const failed = downloads.filter((d) => d.status === "failed").length
    const total = downloads.length

    if (failed === 0) {
      showNotification("Downloads Complete", `Successfully downloaded ${completed} song${completed > 1 ? "s" : ""}!`)
    } else {
      showNotification(
        "Downloads Complete",
        `Downloaded ${completed} song${completed > 1 ? "s" : ""}. ${failed} failed.`,
      )
    }

    console.log(`[v0] Download queue complete: ${completed} succeeded, ${failed} failed`)
    processingRef.current = false
    setIsDownloading(false)
  }, [downloads, showNotification])

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
