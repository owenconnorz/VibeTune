"use client"

let wakeLock: WakeLockSentinel | null = null

export async function requestWakeLock(): Promise<boolean> {
  if (!("wakeLock" in navigator)) {
    console.log("[v0] Wake Lock API not supported")
    return false
  }

  try {
    // Release existing wake lock if any
    if (wakeLock) {
      await wakeLock.release()
      wakeLock = null
    }

    wakeLock = await navigator.wakeLock.request("screen")
    console.log("[v0] ✓ Wake lock acquired - Screen will stay on during playback")

    wakeLock.addEventListener("release", () => {
      console.log("[v0] Wake lock released")
      wakeLock = null
    })

    return true
  } catch (error) {
    // Wake lock may be blocked by permissions policy, iframe restrictions, or browser support
    // This is a non-critical feature, so we gracefully degrade
    if (error instanceof Error && error.message.includes("permissions policy")) {
      console.log("[v0] Wake Lock blocked by permissions policy - feature unavailable")
    } else {
      console.log("[v0] Wake Lock unavailable:", error instanceof Error ? error.message : "Unknown error")
    }
    return false
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    try {
      await wakeLock.release()
      wakeLock = null
      console.log("[v0] Wake lock released manually")
    } catch (error) {
      console.error("[v0] Error releasing wake lock:", error)
    }
  }
}

export function isWakeLockActive(): boolean {
  return wakeLock !== null && !wakeLock.released
}
