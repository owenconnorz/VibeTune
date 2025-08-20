"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Smartphone, Wifi, WifiOff } from "lucide-react"

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [swRegistered, setSWRegistered] = useState(false)
  const [manifestLoaded, setManifestLoaded] = useState(false)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check if app is installed
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true)
      }
    }
    checkInstalled()

    // Check service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        setSWRegistered(!!registration)
      })
    }

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]')
    if (manifestLink) {
      fetch("/manifest.json")
        .then((response) => response.json())
        .then(() => setManifestLoaded(true))
        .catch(() => setManifestLoaded(false))
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const StatusItem = ({ label, status, icon }: { label: string; status: boolean; icon: React.ReactNode }) => (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
    </div>
  )

  return (
    <div className="fixed top-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg z-50 w-64">
      <h3 className="font-semibold text-sm mb-3">PWA Status</h3>
      <div className="space-y-2">
        <StatusItem
          label="Online"
          status={isOnline}
          icon={isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        />
        <StatusItem label="Installed" status={isInstalled} icon={<Smartphone className="w-4 h-4" />} />
        <StatusItem label="Service Worker" status={swRegistered} icon={<CheckCircle className="w-4 h-4" />} />
        <StatusItem label="Manifest" status={manifestLoaded} icon={<CheckCircle className="w-4 h-4" />} />
      </div>
      {!isInstalled && (
        <p className="text-xs text-muted-foreground mt-2">Visit on mobile and look for "Add to Home Screen" option</p>
      )}
    </div>
  )
}
