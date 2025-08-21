"use client"
import { useState, useEffect } from "react"
import { Download, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true)
        return
      }

      // Check for iOS standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    checkIfInstalled()

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("[v0] User accepted the install prompt")
      } else {
        console.log("[v0] User dismissed the install prompt")
      }

      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error("[v0] Error during app installation:", error)
    }
  }

  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <Smartphone className="w-5 h-5 text-green-500" />
        <div>
          <p className="font-medium text-green-400">App Installed</p>
          <p className="text-sm text-green-300/70">VibeTune is installed on your device</p>
        </div>
      </div>
    )
  }

  if (!isInstallable) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg opacity-50">
        <Download className="w-5 h-5 text-gray-400" />
        <div>
          <p className="font-medium text-gray-400">Install App</p>
          <p className="text-sm text-gray-500">Not available on this device</p>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      className="w-full justify-start gap-3 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
    >
      <Download className="w-5 h-5" />
      <div className="text-left">
        <p className="font-medium">Install App</p>
        <p className="text-sm opacity-70">Add VibeTune to your home screen</p>
      </div>
    </Button>
  )
}
