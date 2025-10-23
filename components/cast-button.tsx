"use client"

import { useState, useEffect } from "react"
import { Cast, BluetoothConnected as CastConnected } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CastManager } from "@/lib/cast-manager"
import { cn } from "@/lib/utils"

interface CastButtonProps {
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function CastButton({ className, size = "icon" }: CastButtonProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const castManager = CastManager.getInstance()

    // Initialize cast manager
    castManager.initialize().catch((error) => {
      console.error("[v0] Failed to initialize cast:", error)
    })

    // Subscribe to cast state changes
    const unsubscribe = castManager.subscribe((state) => {
      setIsConnected(state.isConnected)
      setDeviceName(state.deviceName)
    })

    return () => unsubscribe()
  }, [])

  const handleCastClick = async () => {
    const castManager = CastManager.getInstance()

    if (isConnected) {
      castManager.endSession()
    } else {
      try {
        await castManager.requestSession()
      } catch (error) {
        console.error("[v0] Failed to start cast session:", error)
      }
    }
  }

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCastClick}
      className={cn(isConnected && "text-primary", className)}
      title={isConnected ? `Connected to ${deviceName}` : "Cast to device"}
    >
      {isConnected ? <CastConnected className="w-5 h-5" /> : <Cast className="w-5 h-5" />}
    </Button>
  )
}
