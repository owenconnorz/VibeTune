"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, CheckCircle2, XCircle } from "lucide-react"

export function DevicePermissions() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("[v0] Notifications not supported")
      return
    }

    setIsRequesting(true)
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      console.log("[v0] Notification permission:", permission)

      if (permission === "granted") {
        new Notification("VibeTune", {
          body: "Notifications enabled! You'll see playback controls in your notification tray.",
          icon: "/icon-192.jpg",
          badge: "/icon-192.jpg",
        })
      }
    } catch (error) {
      console.error("[v0] Error requesting notification permission:", error)
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          {notificationPermission === "granted" ? (
            <Bell className="h-6 w-6 text-primary" />
          ) : (
            <BellOff className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Control playback from your notification tray and lock screen
            </p>
          </div>

          <div className="flex items-center gap-2">
            {notificationPermission === "granted" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Notifications enabled</span>
              </>
            ) : notificationPermission === "denied" ? (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Notifications blocked</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Notifications not enabled</span>
              </>
            )}
          </div>

          {notificationPermission === "default" && (
            <Button onClick={requestNotificationPermission} disabled={isRequesting} size="sm" className="w-full">
              {isRequesting ? "Requesting..." : "Enable Notifications"}
            </Button>
          )}

          {notificationPermission === "denied" && (
            <p className="text-xs text-muted-foreground">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
