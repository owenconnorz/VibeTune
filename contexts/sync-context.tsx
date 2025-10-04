"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import type { InnertubePlaylist, InnertubeVideo } from "@/lib/innertube-api"

export interface SyncData {
  playlists: InnertubePlaylist[]
  likedSongs: InnertubeVideo[]
  lastSyncTime: string | null
}

export interface SyncStatus {
  isSync: boolean
  progress: number
  currentStep: string
  error: string | null
}

interface SyncContextType {
  syncData: SyncData
  syncStatus: SyncStatus
  syncSettings: {
    autoSync: boolean
    syncPlaylists: boolean
    syncLikedSongs: boolean
  }
  updateSyncSettings: (settings: Partial<SyncContextType["syncSettings"]>) => void
  performSync: () => Promise<void>
  clearSyncData: () => void
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

const SYNC_STORAGE_KEY = "vibetune-sync-data"
const SYNC_SETTINGS_KEY = "vibetune-sync-settings"

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [syncData, setSyncData] = useState<SyncData>({
    playlists: [],
    likedSongs: [],
    lastSyncTime: null,
  })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSync: false,
    progress: 0,
    currentStep: "",
    error: null,
  })
  const [syncSettings, setSyncSettings] = useState({
    autoSync: false,
    syncPlaylists: true,
    syncLikedSongs: true,
  })

  // Load sync data and settings from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(SYNC_STORAGE_KEY)
    const savedSettings = localStorage.getItem(SYNC_SETTINGS_KEY)

    if (savedData) {
      try {
        setSyncData(JSON.parse(savedData))
      } catch (error) {
        console.error("Error loading sync data:", error)
      }
    }

    if (savedSettings) {
      try {
        setSyncSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error("Error loading sync settings:", error)
      }
    }
  }, [])

  // Save sync data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(syncData))
  }, [syncData])

  // Save sync settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(syncSettings))
  }, [syncSettings])

  // Auto-sync when user logs in and auto-sync is enabled
  useEffect(() => {
    if (user && syncSettings.autoSync && !syncStatus.isSync) {
      const lastSync = syncData.lastSyncTime
      const now = new Date().getTime()
      const lastSyncTime = lastSync ? new Date(lastSync).getTime() : 0
      const timeDiff = now - lastSyncTime
      const oneHour = 60 * 60 * 1000

      // Auto-sync if last sync was more than 1 hour ago
      if (timeDiff > oneHour) {
        performSync()
      }
    }
  }, [user, syncSettings.autoSync])

  const updateSyncSettings = (newSettings: Partial<SyncContextType["syncSettings"]>) => {
    setSyncSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const performSync = async () => {
    if (!user || syncStatus.isSync) return

    setSyncStatus({
      isSync: true,
      progress: 0,
      currentStep: "Starting sync...",
      error: null,
    })

    try {
      const newSyncData = { ...syncData }

      // Step 1: Sync playlists if enabled
      if (syncSettings.syncPlaylists) {
        setSyncStatus((prev) => ({
          ...prev,
          progress: 25,
          currentStep: "Syncing playlists...",
        }))

        try {
            const playlistResponse = await fetch("/api/playlists", {
              headers: {
                Authorization: `Bearer ${user.accessToken || ""}`,
              },
            })
        if (playlistResponse.ok) {
          const playlistData = await playlistResponse.json()
          newSyncData.playlists = playlistData.playlists
        } else {
          throw new Error("Failed to sync playlists")
        }
      }

      // Step 2: Sync liked songs if enabled
      if (syncSettings.syncLikedSongs) {
        setSyncStatus((prev) => ({
          ...prev,
          progress: 75,
          currentStep: "Syncing liked songs...",
        }))

        const likedResponse = await fetch("/api/liked-songs")
        if (likedResponse.ok) {
          const likedData = await likedResponse.json()
          newSyncData.likedSongs = likedData.songs
        } else {
          throw new Error("Failed to sync liked songs")
        }
      }

      // Step 3: Complete sync
      setSyncStatus((prev) => ({
        ...prev,
        progress: 100,
        currentStep: "Finalizing sync...",
      }))

      newSyncData.lastSyncTime = new Date().toISOString()
      setSyncData(newSyncData)

      setSyncStatus({
        isSync: false,
        progress: 100,
        currentStep: "Sync completed successfully",
        error: null,
      })

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSyncStatus((prev) => ({
          ...prev,
          currentStep: "",
          progress: 0,
        }))
      }, 3000)
    } catch (error) {
      console.error("Sync failed:", error)
      setSyncStatus({
        isSync: false,
        progress: 0,
        currentStep: "",
        error: error instanceof Error ? error.message : "Sync failed",
      })

      // Clear error message after 5 seconds
      setTimeout(() => {
        setSyncStatus((prev) => ({
          ...prev,
          error: null,
        }))
      }, 5000)
    }
  }

  const clearSyncData = () => {
    setSyncData({
      playlists: [],
      likedSongs: [],
      lastSyncTime: null,
    })
    localStorage.removeItem(SYNC_STORAGE_KEY)
  }

  return (
    <SyncContext.Provider
      value={{
        syncData,
        syncStatus,
        syncSettings,
        updateSyncSettings,
        performSync,
        clearSyncData,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider")
  }
  return context
}
