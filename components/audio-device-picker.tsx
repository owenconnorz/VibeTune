"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Smartphone, Wifi, Bluetooth, Speaker, Laptop, Check, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    setMounted(true)
    loadDevices()
  }, [])

  const loadDevices = async () => {
    // Default device (this device)
    const defaultDevices: AudioDevice[] = [
      {
        id: "this-device",
        name: "This Device",
        type: "phone",
        connected: true,
        available: true,
      },
    ]

    // Try to enumerate audio output devices using Web Audio API
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices()
        const audioOutputs = mediaDevices.filter((device) => device.kind === "audiooutput")

        const detectedDevices: AudioDevice[] = audioOutputs
          .filter((device) => device.deviceId !== "default")
          .map((device) => ({
            id: device.deviceId,
            name: device.label || "Audio Output",
            type: detectDeviceType(device.label),
            connected: false,
            available: true,
          }))

        setDevices([...defaultDevices, ...detectedDevices])
      } catch (error) {
        console.log("[v0] Could not enumerate devices:", error)
        setDevices(defaultDevices)
      }
    } else {
      setDevices(defaultDevices)
    }
  }

  const detectDeviceType = (label: string): AudioDevice["type"] => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes("bluetooth")) return "bluetooth"
    if (lowerLabel.includes("speaker")) return "speaker"
    if (lowerLabel.includes("headphone") || lowerLabel.includes("headset")) return "bluetooth"
    if (lowerLabel.includes("airpods") || lowerLabel.includes("buds")) return "bluetooth"
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
    setSelectedDevice(deviceId)

    // Try to set the audio output device using setSinkId (if supported)
    if (deviceId !== "this-device") {
      try {
        // Get all audio elements
        const audioElements = document.querySelectorAll("audio")
        const videoElements = document.querySelectorAll("video")

        // Set sink ID for all audio/video elements
        for (const element of audioElements) {
          if ("setSinkId" in element) {
            await (element as any).setSinkId(deviceId)
            console.log("[v0] Audio output set to:", deviceId)
          }
        }

        for (const element of videoElements) {
          if ("setSinkId" in element) {
            await (element as any).setSinkId(deviceId)
            console.log("[v0] Video audio output set to:", deviceId)
          }
        }

        // Update device connection status
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
      // Reset to default device
      setDevices((prev) =>
        prev.map((device) => ({
          ...device,
          connected: device.id === "this-device",
        })),
      )
    }
  }

  if (!mounted) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="text-xl font-semibold">Select a device</DrawerTitle>
          <p className="text-sm text-muted-foreground mt-1">Play music on your speakers, TV, or other devices</p>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-4 space-y-6">
          {/* Current Device Section */}
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

          {/* Available Devices Section */}
          {devices.filter((device) => device.id !== "this-device").length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">AVAILABLE DEVICES</h3>
              <div className="space-y-2">
                {devices
                  .filter((device) => device.id !== "this-device")
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
                          <div className="text-sm text-muted-foreground">
                            {device.type === "bluetooth" && "Bluetooth"}
                            {device.type === "wifi" && "WiFi"}
                            {device.type === "speaker" && "Speaker"}
                            {device.type === "computer" && "Computer"}
                          </div>
                        </div>
                        {isSelected && <Check className="w-6 h-6 text-primary" />}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Connect to a device</h4>
            <p className="text-xs text-muted-foreground">
              Make sure your Bluetooth or WiFi devices are turned on and discoverable. Some devices may require pairing
              in your system settings first.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
