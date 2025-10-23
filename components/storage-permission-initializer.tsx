"use client"

import { useEffect } from "react"
import { requestPersistentStorage, checkStorageEstimate } from "@/lib/storage-permissions"

export function StoragePermissionInitializer() {
  useEffect(() => {
    const initializeStoragePermissions = async () => {
      console.log("[v0] Initializing storage permissions...")

      // Request persistent storage to protect downloaded music
      const isPersisted = await requestPersistentStorage()

      if (isPersisted) {
        console.log("[v0] ✓ Storage is persistent - Downloads are protected")
      } else {
        console.log("[v0] ⚠ Storage is not persistent - Downloads may be cleared when storage is low")
      }

      // Check storage usage
      const estimate = await checkStorageEstimate()
      if (estimate) {
        console.log("[v0] Storage info:", {
          used: `${(estimate.usage / 1024 / 1024).toFixed(2)} MB`,
          total: `${(estimate.quota / 1024 / 1024).toFixed(2)} MB`,
          percentage: `${estimate.percentage.toFixed(2)}%`,
        })
      }
    }

    // Wait a bit before requesting to avoid overwhelming the user on first load
    const timeout = setTimeout(initializeStoragePermissions, 2000)

    return () => clearTimeout(timeout)
  }, [])

  return null
}
