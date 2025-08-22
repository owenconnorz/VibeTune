export class PermissionsManager {
  private static wakeLockSentinel: WakeLockSentinel | null = null

  static async requestNotifications(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("[Permissions] Notifications not supported")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission === "denied") {
      console.warn("[Permissions] Notifications denied by user")
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    } catch (error) {
      console.error("[Permissions] Notification request failed:", error)
      return false
    }
  }

  static async requestPersistentStorage(): Promise<boolean> {
    if (!("storage" in navigator) || !("persist" in navigator.storage)) {
      console.warn("[Permissions] Persistent storage not supported")
      return false
    }

    try {
      const persistent = await navigator.storage.persist()
      console.log("[Permissions] Persistent storage granted:", persistent)
      return persistent
    } catch (error) {
      console.error("[Permissions] Persistent storage request failed:", error)
      return false
    }
  }

  static async requestWakeLock(): Promise<WakeLockSentinel | null> {
    if (!("wakeLock" in navigator)) {
      console.warn("[Permissions] Wake lock not supported")
      return null
    }

    try {
      // Check if wake lock is allowed by permissions policy
      if ("permissions" in navigator && "query" in navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: "screen-wake-lock" as PermissionName })
          if (permissionStatus.state === "denied") {
            console.warn("[Permissions] Wake lock denied by permissions policy")
            return null
          }
        } catch (policyError) {
          // Permissions query might not support screen-wake-lock, continue with request
          console.warn("[Permissions] Could not query wake lock permission, attempting request anyway")
        }
      }

      if (this.wakeLockSentinel) {
        await this.wakeLockSentinel.release()
      }

      this.wakeLockSentinel = await navigator.wakeLock.request("screen")
      console.log("[Permissions] Wake lock acquired")

      this.wakeLockSentinel.addEventListener("release", () => {
        console.log("[Permissions] Wake lock released")
        this.wakeLockSentinel = null
      })

      return this.wakeLockSentinel
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissions policy")) {
        console.warn("[Permissions] Wake lock blocked by permissions policy - this is normal in some environments")
        return null
      } else if (error instanceof Error && error.message.includes("not allowed")) {
        console.warn("[Permissions] Wake lock not allowed - user may need to interact with page first")
        return null
      } else {
        console.warn("[Permissions] Wake lock request failed:", error)
        return null
      }
    }
  }

  static async releaseWakeLock(): Promise<void> {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release()
        this.wakeLockSentinel = null
        console.log("[Permissions] Wake lock released manually")
      } catch (error) {
        console.error("[Permissions] Wake lock release failed:", error)
      }
    }
  }

  static async requestBatteryOptimizationExemption(): Promise<boolean> {
    // Check if we're on Android
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid) {
      console.log("[Permissions] Not on Android, skipping battery optimization")
      return true
    }

    try {
      // Request persistent storage first
      const persistentGranted = await this.requestPersistentStorage()

      // Show user instructions for battery optimization
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("VibeTune Background Playback", {
          body: "To prevent music interruption, please disable battery optimization for this app in your device settings.",
          icon: "/icon-192.png",
          tag: "battery-optimization",
          requireInteraction: true,
        })
      }

      console.log("[Permissions] Battery optimization exemption requested")
      return persistentGranted
    } catch (error) {
      console.error("[Permissions] Battery optimization request failed:", error)
      return false
    }
  }

  static async setupBackgroundPlaybackProtection(): Promise<void> {
    try {
      // Request all necessary permissions
      await this.requestNotifications()
      await this.requestPersistentStorage()
      await this.requestBatteryOptimizationExemption()

      // Setup visibility change handler to maintain wake lock
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible" && !this.wakeLockSentinel) {
          // Re-acquire wake lock when app becomes visible
          await this.requestWakeLock()
        }
      })

      // Setup page unload handler
      window.addEventListener("beforeunload", () => {
        this.releaseWakeLock()
      })

      console.log("[Permissions] Background playback protection setup complete")
    } catch (error) {
      console.error("[Permissions] Background playback protection setup failed:", error)
    }
  }

  static showBatteryOptimizationInstructions(): void {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid) return

    const instructions = `
To prevent VibeTune from being killed by Android:

1. Go to Settings > Apps > VibeTune
2. Tap "Battery" or "Battery Usage"
3. Select "Don't optimize" or "Allow background activity"
4. Enable "Auto-start" if available

This ensures uninterrupted music playback.
    `.trim()

    // Show as notification if available
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Prevent App Killing", {
        body: "Tap to see instructions for uninterrupted playback",
        icon: "/icon-192.png",
        tag: "battery-instructions",
        requireInteraction: true,
      })
    }

    console.log("[Instructions] Battery optimization:", instructions)
  }

  static async getStorageEstimate(): Promise<StorageEstimate | null> {
    if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
      console.warn("[Storage] Storage estimate not supported")
      return null
    }

    try {
      const estimate = await navigator.storage.estimate()
      console.log("[Storage] Current usage:", {
        used: estimate.usage ? Math.round(estimate.usage / 1024 / 1024) + " MB" : "Unknown",
        quota: estimate.quota ? Math.round(estimate.quota / 1024 / 1024) + " MB" : "Unknown",
        percentage:
          estimate.usage && estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) + "%" : "Unknown",
      })
      return estimate
    } catch (error) {
      console.error("[Storage] Estimate request failed:", error)
      return null
    }
  }

  static setupMediaSession(metadata: {
    title: string
    artist: string
    album?: string
    artwork?: { src: string; sizes: string; type: string }[]
  }): void {
    if (!("mediaSession" in navigator)) {
      console.warn("[Permissions] Media session not supported")
      return
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album || "VibeTune",
        artwork: metadata.artwork || [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      })
      console.log("[MediaSession] Metadata updated:", metadata.title)
    } catch (error) {
      console.error("[MediaSession] Setup failed:", error)
    }
  }

  static async checkAllPermissions(): Promise<{
    notifications: boolean
    persistentStorage: boolean
    wakeLock: boolean
    mediaSession: boolean
    serviceWorker: boolean
    backgroundSync: boolean
    batteryOptimization: boolean
  }> {
    const batteryOptimization = await this.requestPersistentStorage()

    return {
      notifications: "Notification" in window && Notification.permission === "granted",
      persistentStorage: "storage" in navigator && "persist" in navigator.storage,
      wakeLock: "wakeLock" in navigator,
      mediaSession: "mediaSession" in navigator,
      serviceWorker: "serviceWorker" in navigator,
      backgroundSync: "serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype,
      batteryOptimization,
    }
  }
}
