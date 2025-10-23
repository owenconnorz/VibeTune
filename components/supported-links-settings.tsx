"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"

export function SupportedLinksSettings() {
  const router = useRouter()
  const [openSupportedLinks, setOpenSupportedLinks] = useState(true)
  const [supportedDomains, setSupportedDomains] = useState({
    "youtu.be": true,
    "m.youtube.com": true,
    "youtube.com": true,
    "www.youtube.com": true,
    "music.youtube.com": true,
  })

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("openSupportedLinks")
    if (saved !== null) {
      setOpenSupportedLinks(JSON.parse(saved))
    }

    const savedDomains = localStorage.getItem("supportedDomains")
    if (savedDomains) {
      setSupportedDomains(JSON.parse(savedDomains))
    }
  }, [])

  const handleToggleMain = (checked: boolean) => {
    setOpenSupportedLinks(checked)
    localStorage.setItem("openSupportedLinks", JSON.stringify(checked))
  }

  const handleToggleDomain = (domain: string, checked: boolean) => {
    const updated = { ...supportedDomains, [domain]: checked }
    setSupportedDomains(updated)
    localStorage.setItem("supportedDomains", JSON.stringify(updated))
  }

  const openDeviceSettings = () => {
    // Try to open device settings for app associations
    // This works on Android devices
    if (typeof window !== "undefined") {
      // For Android, try to open app settings
      const isAndroid = /Android/i.test(navigator.userAgent)

      if (isAndroid) {
        // Try to open Android app settings
        window.location.href = "intent://settings#Intent;scheme=android-app;package=com.android.settings;end"
      } else {
        // For other platforms, show a message
        alert("Please open your device settings and navigate to App settings to configure default apps.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Set as default</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* App Icon and Name */}
        <div className="flex items-center gap-4 px-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-white"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">VibeTune</h2>
        </div>

        {/* Description */}
        <p className="text-muted-foreground px-2">
          Select whether to open this app instead of your browser app when you go to supported web addresses.
        </p>

        {/* Open Supported Links Toggle */}
        <div className="bg-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Open supported links</span>
            <Switch checked={openSupportedLinks} onCheckedChange={handleToggleMain} />
          </div>
        </div>

        {/* Supported Web Addresses */}
        {openSupportedLinks && (
          <div className="bg-card rounded-2xl p-4 space-y-4">
            <button
              onClick={() => router.push("/dashboard/settings/supported-links/domains")}
              className="w-full text-left font-medium hover:opacity-80 transition-opacity"
            >
              Supported web addresses
            </button>
          </div>
        )}

        {/* Open Device Settings Button */}
        <Button
          onClick={openDeviceSettings}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 bg-transparent"
        >
          <ExternalLink className="w-4 h-4" />
          Open device settings
        </Button>

        {/* Info Text */}
        <p className="text-sm text-muted-foreground px-2">
          To set VibeTune as the default app for music links, you may need to configure this in your device settings
          under "Default apps" or "App links".
        </p>
      </div>
    </div>
  )
}
