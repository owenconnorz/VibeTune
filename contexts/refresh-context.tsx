"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { musicCache } from "@/lib/music-cache"

interface RefreshContextType {
  isRefreshing: boolean
  lastRefresh: Date | null
  refreshAll: () => Promise<void>
  refreshTrending: () => Promise<void>
  refreshNewReleases: () => Promise<void>
  refreshMoodPlaylists: () => Promise<void>
  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (enabled: boolean) => void
  refreshInterval: number
  setRefreshInterval: (minutes: number) => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function useRefresh() {
  const context = useContext(RefreshContext)
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider")
  }
  return context
}

interface RefreshProviderProps {
  children: React.ReactNode
}

export function RefreshProvider({ children }: RefreshProviderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // minutes
  const [refreshCallbacks, setRefreshCallbacks] = useState<{
    trending?: () => Promise<void>
    newReleases?: () => Promise<void>
    moodPlaylists?: (() => Promise<void>)[]
  }>({})

  // Register refresh callbacks from hooks
  const registerRefreshCallback = useCallback((type: string, callback: () => Promise<void>) => {
    setRefreshCallbacks((prev) => {
      if (type === "moodPlaylists") {
        return {
          ...prev,
          moodPlaylists: [...(prev.moodPlaylists || []), callback],
        }
      }
      return {
        ...prev,
        [type]: callback,
      }
    })
  }, [])

  const refreshAll = useCallback(async () => {
    if (isRefreshing) return

    try {
      setIsRefreshing(true)
      console.log("[v0] Starting global refresh...")

      // Clear cache to force fresh data
      musicCache.clearAll()

      // Trigger all registered refresh callbacks
      const promises: Promise<void>[] = []

      if (refreshCallbacks.trending) {
        promises.push(refreshCallbacks.trending())
      }

      if (refreshCallbacks.newReleases) {
        promises.push(refreshCallbacks.newReleases())
      }

      if (refreshCallbacks.moodPlaylists) {
        promises.push(...refreshCallbacks.moodPlaylists.map((callback) => callback()))
      }

      await Promise.allSettled(promises)
      setLastRefresh(new Date())
      console.log("[v0] Global refresh completed")
    } catch (error) {
      console.error("[v0] Global refresh failed:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, refreshCallbacks])

  const refreshTrending = useCallback(async () => {
    if (refreshCallbacks.trending) {
      await refreshCallbacks.trending()
      setLastRefresh(new Date())
    }
  }, [refreshCallbacks.trending])

  const refreshNewReleases = useCallback(async () => {
    if (refreshCallbacks.newReleases) {
      await refreshCallbacks.newReleases()
      setLastRefresh(new Date())
    }
  }, [refreshCallbacks.newReleases])

  const refreshMoodPlaylists = useCallback(async () => {
    if (refreshCallbacks.moodPlaylists) {
      await Promise.allSettled(refreshCallbacks.moodPlaylists.map((callback) => callback()))
      setLastRefresh(new Date())
    }
  }, [refreshCallbacks.moodPlaylists])

  // Auto refresh functionality
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const interval = setInterval(
      () => {
        console.log("[v0] Auto refresh triggered")
        refreshAll()
      },
      refreshInterval * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, refreshInterval, refreshAll])

  const value: RefreshContextType = {
    isRefreshing,
    lastRefresh,
    refreshAll,
    refreshTrending,
    refreshNewReleases,
    refreshMoodPlaylists,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    refreshInterval,
    setRefreshInterval,
  }

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
}
