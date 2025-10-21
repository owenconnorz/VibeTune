"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HardDrive, CheckCircle2, AlertCircle } from "lucide-react"

export function StorageManager() {
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [isPersistent, setIsPersistent] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    checkStorageStatus()
  }, [])

  const checkStorageStatus = async () => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        setStorageEstimate({
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        })

        const persistent = await navigator.storage.persisted()
        setIsPersistent(persistent)
        console.log("[v0] Storage persistent:", persistent)
      } catch (error) {
        console.error("[v0] Error checking storage:", error)
      }
    }
  }

  const requestPersistentStorage = async () => {
    if (!("storage" in navigator) || !("persist" in navigator.storage)) {
      console.log("[v0] Persistent storage not supported")
      return
    }

    setIsRequesting(true)
    try {
      const persistent = await navigator.storage.persist()
      setIsPersistent(persistent)
      console.log("[v0] Persistent storage granted:", persistent)

      if (persistent) {
        await checkStorageStatus()
      }
    } catch (error) {
      console.error("[v0] Error requesting persistent storage:", error)
    } finally {
      setIsRequesting(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  if (!storageEstimate) return null

  const usagePercent = (storageEstimate.usage / storageEstimate.quota) * 100

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <HardDrive className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold">Device Storage</h3>
            <p className="text-sm text-muted-foreground">
              {formatBytes(storageEstimate.usage)} of {formatBytes(storageEstimate.quota)} used (
              {usagePercent.toFixed(1)}%)
            </p>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${usagePercent}%` }} />
          </div>

          <div className="flex items-center gap-2">
            {isPersistent ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Persistent storage enabled</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Storage may be cleared by the system</span>
              </>
            )}
          </div>

          {!isPersistent && (
            <Button onClick={requestPersistentStorage} disabled={isRequesting} size="sm" className="w-full">
              {isRequesting ? "Requesting..." : "Enable Persistent Storage"}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Persistent storage prevents your playlists, history, and cached music from being automatically deleted by
            the system.
          </p>
        </div>
      </div>
    </Card>
  )
}
