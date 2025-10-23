"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      // Check if we're in a preview/iframe environment
      const isPreview =
        window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("preview")

      if (isPreview) {
        console.log("[v0] Service Worker disabled in preview environment")
        return
      }

      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .then((registration) => {
          console.log("[v0] Service Worker registered successfully")

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000)

          if ("sync" in registration) {
            registration.sync.register("sync-queue").catch((error) => {
              console.log("[v0] Background sync not available:", error.message)
            })
          }
        })
        .catch((error) => {
          console.log("[v0] Service Worker registration failed (app will work without it):", error.message)
        })
    }

    if ("mediaSession" in navigator) {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          console.log("[v0] App backgrounded, media session active")
        }
      })
    }

    let wakeLock: any = null
    const requestWakeLock = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request("screen")
          console.log("[v0] Wake lock acquired")

          wakeLock.addEventListener("release", () => {
            console.log("[v0] Wake lock released")
          })
        } catch (error) {
          // Wake lock is optional - fail silently
        }
      }
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && wakeLock === null) {
        requestWakeLock()
      }
    })

    if ("mediaDevices" in navigator) {
      navigator.mediaDevices.addEventListener("devicechange", () => {
        console.log("[v0] Audio device changed")
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          const audioOutputs = devices.filter((device) => device.kind === "audiooutput")
          console.log("[v0] Audio outputs:", audioOutputs.length)
        })
      })
    }

    return () => {
      if (wakeLock !== null) {
        wakeLock.release()
      }
    }
  }, [])

  return null
}
