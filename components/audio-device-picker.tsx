"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Smartphone, Wifi, Bluetooth, Speaker, Laptop, Check, Radio, RefreshCw, Cast } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AudioDevice {
  id: string
  name: string
  type: "phone" | "wifi" | "bluetooth" | "computer" | "speaker" | "network"
  connected: boolean
  available: boolean
  model?: string
  ipAddress?: string
  manufacturer?: string
  networkType?: "sonos" | "chromecast" | "airplay" | "dlna" | "upnp"
}

interface AudioDevicePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AudioDevicePicker({ open, onOpenChange }: AudioDevicePickerProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [networkDevices, setNetworkDevices] = useState<AudioDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>("this-device")
  const [scanning, setScanning] = useState(false)
  const [castInitialized, setCastInitialized] = useState(false)

  useEffect(() => {
    console.log("[v0] AudioDevicePicker mounted, open:", open)
    loadDevices()
    initializeCast()
  }, [])

  useEffect(() => {
    if (open) {
      console.log("[v0] Device picker opened")
    }
  }, [open])

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

    // Load Cast SDK
    const script = document.createElement("script")
    script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      console.log("[v0] Cast SDK loaded")

      // Wait for Cast API to be available
      const checkCastApi = setInterval(() => {
        if (window.chrome && window.chrome.cast && window.chrome.cast.isAvailable) {
          clearInterval(checkCastApi)
          console.log("[v0] Cast API available")

          // Initialize Cast
          const sessionRequest = new window.chrome.cast.SessionRequest(
            window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          )
          const apiConfig = new window.chrome.cast.ApiConfig(
            sessionRequest,
            (session: any) => {
              console.log("[v0] Cast session started:", session)
            },
            (availability: string) => {
              console.log("[v0] Cast receiver availability:", availability)
              if (availability === window.chrome.cast.ReceiverAvailability.AVAILABLE) {
                setCastInitialized(true)
                discoverCastDevices()
              }
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
            },
          )
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => clearInterval(checkCastApi), 5000)
    }

    script.onerror = () => {
      console.error("[v0] Failed to load Cast SDK")
    }
  }

  const discoverCastDevices = () => {
    if (!window.chrome || !window.chrome.cast || !castInitialized) {
      console.log("[v0] Cast SDK not available for device discovery")
      return
    }

    console.log("[v0] Discovering Cast devices...")

    // Request session to trigger device discovery
    window.chrome.cast.requestSession(
      (session: any) => {
        console.log("[v0] Cast session established:", session)

        const device: AudioDevice = {
          id: `cast-${session.receiver.friendlyName}`,
          name: session.receiver.friendlyName,
          type: "network",
          networkType: "chromecast",
          connected: false,
          available: true,
          model: "Chromecast",
          manufacturer: "Google",
        }

        setNetworkDevices((prev) => {
          const exists = prev.some((d) => d.id === device.id)
          if (exists) return prev
          return [...prev, device]
        })
      },
      (error: any) => {
        // User cancelled or no devices found
        console.log("[v0] Cast session request:", error.code)
      },
    )
  }

  const loadNetworkDevices = async () => {
    console.log("[v0] Network device discovery - using Cast SDK only")
    // Cast devices are discovered via Cast SDK in initializeCast()
    // No mock devices are loaded
  }

  const detectDeviceType = (label: string): AudioDevice["type"] => {
    const lowerLabel = label.toLowerCase()

    if (lowerLabel.includes("bluetooth") || lowerLabel.includes("bt")) return "bluetooth"
    if (lowerLabel.includes("speaker") || lowerLabel.includes("audio")) return "speaker"
    if (lowerLabel.includes("wifi") || lowerLabel.includes("network")) return "wifi"
    return "computer"
  }

  const getDeviceIcon = (device: AudioDevice) => {
    if (device.type === "network") {
      switch (device.networkType) {
        case "sonos":
          return Speaker
        case "chromecast":
          return Cast
        case "airplay":
          return Wifi
        default:
          return Speaker
      }
    }

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
      default:
        return Speaker
    }
  }

  const handleDeviceSelect = async (deviceId: string) => {
    console.log("[v0] Selecting device:", deviceId)
    setSelectedDevice(deviceId)

    const isNetworkDevice = networkDevices.some((device) => device.id === deviceId)

    if (isNetworkDevice) {
      console.log("[v0] Network device selected:", deviceId)
      setNetworkDevices((prev) =>
        prev.map((device) => ({
          ...device,
          connected: device.id === deviceId,
        })),
      )
      setDevices((prev) =>
        prev.map((device) => ({
          ...device,
          connected: false,
        })),
      )
      return
    }

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
        setNetworkDevices((prev) =>
          prev.map((device) => ({
            ...device,
            connected: false,
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
      setNetworkDevices((prev) =>
        prev.map((device) => ({
          ...device,
          connected: false,
        })),
      )
    }
  }

  const handleRefresh = () => {
    console.log("[v0] Refreshing device list...")
    setScanning(true)
    loadDevices()
    if (castInitialized) {
      discoverCastDevices()
    }
    setTimeout(() => setScanning(false), 1000)
  }

  const categorizeDevices = () => {
    const categories = {
      current: devices.filter((d) => d.id === "this-device"),
      local: devices.filter((d) => d.id !== "this-device"),
      sonos: networkDevices.filter((d) => d.networkType === "sonos"),
      chromecast: networkDevices.filter((d) => d.networkType === "chromecast"),
      other: networkDevices.filter((d) => !["sonos", "chromecast"].includes(d.networkType || "")),
    }
    return categories
  }

  const { current, local, sonos, chromecast, other } = categorizeDevices()
  const hasDevices = local.length > 0 || networkDevices.length > 0

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
          <DeviceSection
            title="CURRENT DEVICE"
            devices={current}
            selectedDevice={selectedDevice}
            onSelect={handleDeviceSelect}
            getIcon={getDeviceIcon}
          />

          {/* Network Devices */}
          {sonos.length > 0 && (
            <DeviceSection
              title={`SONOS SPEAKERS (${sonos.length})`}
              devices={sonos}
              selectedDevice={selectedDevice}
              onSelect={handleDeviceSelect}
              getIcon={getDeviceIcon}
            />
          )}

          {chromecast.length > 0 && (
            <DeviceSection
              title={`CHROMECAST (${chromecast.length})`}
              devices={chromecast}
              selectedDevice={selectedDevice}
              onSelect={handleDeviceSelect}
              getIcon={getDeviceIcon}
            />
          )}

          {other.length > 0 && (
            <DeviceSection
              title={`NETWORK DEVICES (${other.length})`}
              devices={other}
              selectedDevice={selectedDevice}
              onSelect={handleDeviceSelect}
              getIcon={getDeviceIcon}
            />
          )}

          {/* Local Devices */}
          {local.length > 0 && (
            <DeviceSection
              title={`LOCAL DEVICES (${local.length})`}
              devices={local}
              selectedDevice={selectedDevice}
              onSelect={handleDeviceSelect}
              getIcon={getDeviceIcon}
            />
          )}

          {/* No Devices Found */}
          {!hasDevices && (
            <div className="bg-muted/50 rounded-lg p-6 text-center space-y-3">
              <Speaker className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h4 className="font-semibold">No devices found</h4>
              <p className="text-sm text-muted-foreground">
                Connect Bluetooth speakers, Sonos, Chromecast, or other network audio devices to see them here
              </p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2 bg-transparent">
                <RefreshCw className="w-4 h-4 mr-2" />
                Scan for devices
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function DeviceSection({
  title,
  devices,
  selectedDevice,
  onSelect,
  getIcon,
}: {
  title: string
  devices: AudioDevice[]
  selectedDevice: string
  onSelect: (id: string) => void
  getIcon: (device: AudioDevice) => any
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">{title}</h3>
      <div className="space-y-2">
        {devices.map((device) => {
          const Icon = getIcon(device)
          const isSelected = selectedDevice === device.id

          return (
            <button
              key={device.id}
              onClick={() => onSelect(device.id)}
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
                  {isSelected && device.id === "this-device" ? (
                    <span className="flex items-center gap-2">
                      <Radio className="w-3 h-3 text-primary animate-pulse" />
                      <span className="text-primary">Playing</span>
                    </span>
                  ) : device.model && device.ipAddress ? (
                    `${device.model} • ${device.ipAddress}`
                  ) : (
                    <span className="capitalize">{device.type}</span>
                  )}
                </div>
              </div>
              {isSelected && <Check className="w-6 h-6 text-primary" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

declare global {
  interface Window {
    chrome: any
  }
}
