"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { notificationManager } from "@/lib/notification-manager"

export function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if we should show the prompt
    const checkPermission = () => {
      if (!notificationManager.isSupported()) {
        return
      }

      const hasAsked = localStorage.getItem("notification_permission_asked")
      const hasDismissed = localStorage.getItem("notification_permission_dismissed")

      if (!hasAsked && !hasDismissed && !notificationManager.hasPermission()) {
        // Show prompt after 10 seconds
        setTimeout(() => {
          setShow(true)
        }, 10000)
      }
    }

    checkPermission()
  }, [])

  const handleAllow = async () => {
    const granted = await notificationManager.requestPermission()
    localStorage.setItem("notification_permission_asked", "true")
    setShow(false)

    if (granted) {
      console.log("[Notifications] Permission granted")
    }
  }

  const handleDismiss = () => {
    localStorage.setItem("notification_permission_dismissed", "true")
    setDismissed(true)
    setShow(false)
  }

  if (!show || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-border/50 bg-card/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Enable Notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get playback controls on your lock screen and notification shade
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleAllow}>
                Enable
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Not Now
              </Button>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
