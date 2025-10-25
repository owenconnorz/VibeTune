"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)

      if (!online) {
        setShowAlert(true)
      } else {
        // Show "back online" message briefly
        setShowAlert(true)
        setTimeout(() => setShowAlert(false), 3000)
      }
    }

    // Set initial status
    setIsOnline(navigator.onLine)

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  if (!showAlert) return null

  return (
    <div className="fixed top-safe left-0 right-0 z-50 px-4 pt-2">
      <Alert variant={isOnline ? "default" : "destructive"} className="animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <AlertDescription>
            {isOnline
              ? "Back online! You can now stream music."
              : "You're offline. Only downloaded songs are available."}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}
