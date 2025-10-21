"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[v0] Service Worker registered:", registration.scope)

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000) // Check every minute

          if ("sync" in registration) {
            registration.sync
              .register("sync-queue")
              .then(() => {
                console.log("[v0] Background sync registered")
              })
              .catch((error) => {
                console.error("[v0] Background sync registration failed:", error)
              })
          }
        })
        .catch((error) => {
          console.error("[v0] Service Worker registration failed:", error)
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
          console.error("[v0] Wake lock request failed:", error)
        }
      }
    }

    // Request wake lock when page becomes visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && wakeLock === null) {
        requestWakeLock()
      }
    })

    if ("mediaDevices" in navigator) {
      navigator.mediaDevices.addEventListener("devicechange", () => {
        console.log("[v0] Audio device changed")
        // Pause playback when headphones are disconnected
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
