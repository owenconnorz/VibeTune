"use client"

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    console.log("[v0] Persistent Storage API not supported")
    return false
  }

  try {
    const isPersisted = await navigator.storage.persisted()
    console.log("[v0] Storage is currently persisted:", isPersisted)

    if (isPersisted) {
      console.log("[v0] Storage is already persistent")
      return true
    }

    const result = await navigator.storage.persist()
    console.log("[v0] Persistent storage request result:", result)

    if (result) {
      console.log("[v0] ✓ Persistent storage granted - Your downloads are protected!")

      // Show notification if available
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Storage Protected", {
          body: "Your downloaded music is now protected from automatic deletion",
          icon: "/icon-192.png",
        })
      }
    } else {
      console.log("[v0] ✗ Persistent storage denied - Downloads may be cleared when storage is low")
    }

    return result
  } catch (error) {
    console.error("[v0] Error requesting persistent storage:", error)
    return false
  }
}

export async function checkStorageEstimate(): Promise<{
  usage: number
  quota: number
  percentage: number
} | null> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentage = quota > 0 ? (usage / quota) * 100 : 0

    console.log("[v0] Storage usage:", {
      usage: `${(usage / 1024 / 1024).toFixed(2)} MB`,
      quota: `${(quota / 1024 / 1024).toFixed(2)} MB`,
      percentage: `${percentage.toFixed(2)}%`,
    })

    return { usage, quota, percentage }
  } catch (error) {
    console.error("[v0] Error checking storage estimate:", error)
    return null
  }
}
