"use client"

import { useEffect } from "react"
import { PermissionsManager } from "@/lib/permissions"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
      console.log("[SW] Skipping service worker registration in preview environment")
      requestPermissions()
      return
    }

    if ("serviceWorker" in navigator) {
      registerServiceWorker()
    }

    setupBackgroundProtection()
  }, [])

  const registerServiceWorker = async () => {
    try {
      const response = await fetch("/sw.js", { method: "HEAD" })
      if (!response.ok) {
        console.log("[SW] Service worker file not found, skipping registration")
        return
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("[SW] Service worker registered:", registration.scope)

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[SW] New service worker available")
              // Optionally show update notification to user
            }
          })
        }
      })
    } catch (error) {
      console.warn("[SW] Service worker registration failed (this is normal in preview environments):", error.message)
    }
  }

  const setupBackgroundProtection = async () => {
    try {
      // Setup comprehensive background playback protection
      await PermissionsManager.setupBackgroundPlaybackProtection()

      // Show battery optimization instructions for Android users
      PermissionsManager.showBatteryOptimizationInstructions()

      console.log("[SW] Background protection setup completed")
    } catch (error) {
      console.error("[SW] Background protection setup failed:", error)
    }
  }

  const requestPermissions = async () => {
    try {
      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        const permission = await Notification.requestPermission()
        console.log("[Permissions] Notification permission:", permission)
      }

      // Request persistent storage permission
      if ("storage" in navigator && "persist" in navigator.storage) {
        const persistent = await navigator.storage.persist()
        console.log("[Permissions] Persistent storage:", persistent)
      }

      // Request wake lock permission (will be requested when needed)
      if ("wakeLock" in navigator) {
        console.log("[Permissions] Wake lock API available")
      }

      // Check storage quota
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        console.log("[Storage] Quota estimate:", estimate)
      }

      // Register for background sync (if supported)
      if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
        console.log("[Permissions] Background sync available")
      }

      // Check media session API
      if ("mediaSession" in navigator) {
        console.log("[Permissions] Media session API available")
        // Set up media session metadata
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "VibeTune Music App",
          artist: "VibeTune",
          artwork: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          ],
        })
      }
    } catch (error) {
      console.error("[Permissions] Permission request failed:", error)
    }
  }

  return null // This component doesn't render anything
}
