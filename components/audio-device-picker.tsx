"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Smartphone, Wifi, Bluetooth, Speaker, Laptop, Check, Radio, RefreshCw, Cast } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AudioDevice {
  id: string
  name: string
  type: "phone" | "wifi" | "bluetooth" | "computer" | "speaker" | "cast"
  connected: boolean
  available: boolean
  model?: string
}

interface AudioDevicePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AudioDevicePicker({ open, onOpenChange }: AudioDevicePickerProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>("this-device")
  const [scanning, setScanning] = useState(false)
  const [castInitialized, setCastInitialized] = useState(false)
  const [castSession, setCastSession] = useState<any>(null)

  useEffect(() => {
    console.log("[v0] AudioDevicePicker mounted")
    loadDevices()
    initializeCast()
  }, [])

  const loadDevices = async () => {
    console.log("[v0] Loading audio devices...")

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
  }

  const initializeCast = () => {
    if (typeof window === "undefined") return

    console.log("[v0] Initializing Cast SDK...")

    const script = document.createElement("script")
    script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      console.log("[v0] Cast SDK script loaded")

      const checkCastApi = setInterval(() => {
        if (window.chrome?.cast?.isAvailable) {
          clearInterval(checkCastApi)
          console.log("[v0] Cast API available")

          try {
            const sessionRequest = new window.chrome.cast.SessionRequest(
              window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            )

            const apiConfig = new window.chrome.cast.ApiConfig(
              sessionRequest,
              (session: any) => {
                console.log("[v0] Cast session started:", session.receiver.friendlyName)
                setCastSession(session)
                setSelectedDevice("cast-device")
              },
              (availability: string) => {
                console.log("[v0] Cast receiver availability:", availability)
              },
            )

            window.chrome.cast.initialize(
              apiConfig,
              () => {
                console.log("[v0] Cast initialized successfully")
                setCastInitialized(true)
              },
              (error: any) => {
                console.error("[v0] Cast initialization error:", error)
                setCastInitialized(true)
              },
            )
          } catch (error) {
            console.error("[v0] Cast setup error:", error)
            setCastInitialized(true)
          }
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkCastApi)
        if (!castInitialized) {
          console.log("[v0] Cast API timeout, showing Cast button anyway")
          setCastInitialized(true)
        }
      }, 3000)
    }

    script.onerror = () => {
      console.error("[v0] Failed to load Cast SDK")
      setCastInitialized(true)
    }
  }

  const handleCastClick = () => {
    if (!window.chrome?.cast) {
      console.error("[v0] Cast SDK not available")
      alert("Cast is not available. Please make sure you're using a supported browser (Chrome, Edge, or Opera).")
      return
    }

    console.log("[v0] Opening Cast device picker...")

    window.chrome.cast.requestSession(
      (session: any) => {
        console.log("[v0] Cast session established:", session.receiver.friendlyName)
        setCastSession(session)
        setSelectedDevice("cast-device")
      },
      (error: any) => {
        if (error.code !== "cancel") {
          console.error("[v0] Cast session request failed:", error)
        } else {
          console.log("[v0] Cast session request cancelled by user")
        }
      },
    )
  }

  const handleStopCast = () => {
    if (castSession) {
      castSession.stop(
        () => {
          console.log("[v0] Cast session stopped")
          setCastSession(null)
          setSelectedDevice("this-device")
        },
        (error: any) => {
          console.error("[v0] Error stopping cast:", error)
        },
      )
    }
  }

  const detectDeviceType = (label: string): AudioDevice["type"] => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes("bluetooth") || lowerLabel.includes("bt")) return "bluetooth"
    if (lowerLabel.includes("speaker") || lowerLabel.includes("audio")) return "speaker"
    if (lowerLabel.includes("wifi") || lowerLabel.includes("network")) return "wifi"
    return "computer"
  }

  const getDeviceIcon = (device: AudioDevice) => {
    switch (device.type) {
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
      case "cast":
        return Cast
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
        console.error("[v0] Could not set audio output:", error)
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
    setScanning(true)
    loadDevices()
    setTimeout(() => setScanning(false), 1000)
  }

  const currentDevice = devices.find((d) => d.id === "this-device") || devices[0]
  const localDevices = devices.filter((d) => d.id !== "this-device")

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
          {/* Current Device */}
          {currentDevice && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">CURRENT DEVICE</h3>
              <div className="space-y-2">
                <DeviceButton
                  device={currentDevice}
                  isSelected={selectedDevice === currentDevice.id && !castSession}
                  onSelect={handleDeviceSelect}
                  getIcon={getDeviceIcon}
                />
              </div>
            </div>
          )}

          {/* Cast Devices */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">CAST TO WIFI DEVICES</h3>
            <div className="space-y-2">
              {castSession ? (
                <button
                  onClick={handleStopCast}
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-primary/10 border-2 border-primary"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                    <Cast className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{castSession.receiver.friendlyName}</div>
                    <div className="text-sm text-primary flex items-center gap-2">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>Casting</span>
                    </div>
                  </div>
                  <Check className="w-6 h-6 text-primary" />
                </button>
              ) : (
                <>
                  <Button
                    onClick={handleCastClick}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 bg-card hover:bg-accent"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted mr-4">
                      <Cast className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Find Cast devices</div>
                      <div className="text-sm text-muted-foreground">
                        Click to discover Chromecast, Google Home, and smart TVs
                      </div>
                    </div>
                  </Button>
                  <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>
                      <strong>Note:</strong> Your WiFi devices (Chromecast, Google Home, smart speakers) will appear
                      when you click the button above. Make sure your devices are on the same WiFi network.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Local Devices */}
          {localDevices.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                LOCAL DEVICES ({localDevices.length})
              </h3>
              <div className="space-y-2">
                {localDevices.map((device) => (
                  <DeviceButton
                    key={device.id}
                    device={device}
                    isSelected={selectedDevice === device.id}
                    onSelect={handleDeviceSelect}
                    getIcon={getDeviceIcon}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function DeviceButton({
  device,
  isSelected,
  onSelect,
  getIcon,
}: {
  device: AudioDevice
  isSelected: boolean
  onSelect: (id: string) => void
  getIcon: (device: AudioDevice) => any
}) {
  const Icon = getIcon(device)

  return (
    <button
      onClick={() => onSelect(device.id)}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg transition-colors",
        isSelected ? "bg-primary/10 border-2 border-primary" : "bg-card hover:bg-accent border-2 border-transparent",
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
          {isSelected && device.id === "this-device" ? (
            <span className="flex items-center gap-2">
              <Radio className="w-3 h-3 text-primary animate-pulse" />
              <span className="text-primary">Playing</span>
            </span>
          ) : (
            <span className="capitalize">{device.type}</span>
          )}
        </div>
      </div>
      {isSelected && <Check className="w-6 h-6 text-primary" />}
    </button>
  )
}

declare global {
  interface Window {
    chrome: any
  }
}
