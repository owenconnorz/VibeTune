"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Smartphone, Wifi, Bluetooth, Speaker, Laptop, Check, Radio, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AudioDevice {
  id: string
  name: string
  type: "phone" | "wifi" | "bluetooth" | "computer" | "speaker"
  connected: boolean
  available: boolean
}

interface AudioDevicePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AudioDevicePicker({ open, onOpenChange }: AudioDevicePickerProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>("this-device")
  const [mounted, setMounted] = useState(false)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadDevices()
  }, [])

  const loadDevices = async () => {
    console.log("[v0] Loading audio devices...")
    setScanning(true)

    const defaultDevices: AudioDevice[] = [
      {
        id: "this-device",
        name: "This Phone",
        type: "phone",
        connected: true,
        available: true,
      },
    ]

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices()
        const audioOutputs = mediaDevices.filter((device) => device.kind === "audiooutput")

        console.log("[v0] Audio output devices found:", audioOutputs.length)

        const detectedDevices: AudioDevice[] = audioOutputs
          .filter((device) => device.deviceId !== "default" && device.deviceId !== "communications")
          .map((device) => ({
            id: device.deviceId,
            name: device.label || "Unknown Audio Device",
            type: detectDeviceType(device.label),
            connected: false,
            available: true,
          }))

        setDevices([...defaultDevices, ...detectedDevices])
      } catch (error) {
        console.error("[v0] Error enumerating devices:", error)
        setDevices(defaultDevices)
      }
    } else {
      console.log("[v0] MediaDevices API not supported")
      setDevices(defaultDevices)
    }

    setScanning(false)
  }

  const detectDeviceType = (label: string): AudioDevice["type"] => {
    const lowerLabel = label.toLowerCase()

    if (lowerLabel.includes("bluetooth") || lowerLabel.includes("bt")) return "bluetooth"
    if (lowerLabel.includes("speaker") || lowerLabel.includes("audio")) return "speaker"
    if (lowerLabel.includes("wifi") || lowerLabel.includes("network")) return "wifi"
    return "computer"
  }

  const getDeviceIcon = (type: AudioDevice["type"]) => {
    switch (type) {
      case "phone":
        return Smartphone
      case "wifi":
        return Wifi
      case "bluetooth":
        return Bluetooth
      case "speaker":
        return Speaker
      case "computer":
        return Laptop
      default:
        return Speaker
    }
  }

  const handleDeviceSelect = async (deviceId: string) => {
    console.log("[v0] Selecting device:", deviceId)
    setSelectedDevice(deviceId)

    if (deviceId !== "this-device") {
      try {
        const audioElements = document.querySelectorAll("audio")
        const videoElements = document.querySelectorAll("video")

        for (const element of audioElements) {
          if ("setSinkId" in element) {
            await (element as any).setSinkId(deviceId)
            console.log("[v0] Audio output set to:", deviceId)
          }
        }

        for (const element of videoElements) {
          if ("setSinkId" in element) {
            await (element as any).setSinkId(deviceId)
          }
        }

        setDevices((prev) =>
          prev.map((device) => ({
            ...device,
            connected: device.id === deviceId,
          })),
        )
      } catch (error) {
        console.log("[v0] Could not set audio output:", error)
      }
    } else {
      setDevices((prev) =>
        prev.map((device) => ({
          ...device,
          connected: device.id === "this-device",
        })),
      )
    }
  }

  const handleRefresh = () => {
    console.log("[v0] Refreshing device list...")
    loadDevices()
  }

  if (!mounted) return null

  const availableDevices = devices.filter((device) => device.id !== "this-device")

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl font-semibold">Select a device</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">Play music on your speakers or other devices</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={scanning}>
              <RefreshCw className={cn("w-5 h-5", scanning && "animate-spin")} />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">CURRENT DEVICE</h3>
            <div className="space-y-2">
              {devices
                .filter((device) => device.id === "this-device")
                .map((device) => {
                  const Icon = getDeviceIcon(device.type)
                  const isSelected = selectedDevice === device.id

                  return (
                    <button
                      key={device.id}
                      onClick={() => handleDeviceSelect(device.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-lg transition-colors",
                        isSelected
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-card hover:bg-accent border-2 border-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{device.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {isSelected && (
                            <>
                              <Radio className="w-3 h-3 text-primary animate-pulse" />
                              <span className="text-primary">Playing</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-6 h-6 text-primary" />}
                    </button>
                  )
                })}
            </div>
          </div>

          {availableDevices.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                AVAILABLE DEVICES ({availableDevices.length})
              </h3>
              <div className="space-y-2">
                {availableDevices.map((device) => {
                  const Icon = getDeviceIcon(device.type)
                  const isSelected = selectedDevice === device.id

                  return (
                    <button
                      key={device.id}
                      onClick={() => handleDeviceSelect(device.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-lg transition-colors",
                        isSelected
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-card hover:bg-accent border-2 border-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{device.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">{device.type}</div>
                      </div>
                      {isSelected && <Check className="w-6 h-6 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {availableDevices.length === 0 && (
            <div className="bg-muted/50 rounded-lg p-6 text-center space-y-3">
              <Speaker className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h4 className="font-semibold">No other devices found</h4>
              <p className="text-sm text-muted-foreground">Connect Bluetooth or other audio devices to see them here</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
