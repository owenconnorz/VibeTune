"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Smartphone, Wifi, Bluetooth, Speaker, Laptop, Check, Radio, RefreshCw, Cast, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCast } from "@/components/cast-provider"

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
  const {
    castAvailable,
    castStatus,
    requestCast,
    sonosAvailable,
    sonosStatus,
    sonosDevices,
    requestSonos,
    refreshSonosDevices,
  } = useCast()

  useEffect(() => {
    console.log("[v0] AudioDevicePicker mounted")
    loadDevices()
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

  const handleCastClick = () => {
    console.log("[v0] Cast: Device picker requesting Cast")
    requestCast()
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
                  isSelected={selectedDevice === currentDevice.id}
                  onSelect={handleDeviceSelect}
                  getIcon={getDeviceIcon}
                />
              </div>
            </div>
          )}

          {/* Sonos Devices */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">SONOS SPEAKERS</h3>
            <div className="space-y-2">
              {sonosStatus === "loading" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Loading Sonos devices...</AlertDescription>
                </Alert>
              )}

              {sonosStatus === "unavailable" && (
                <Button
                  onClick={requestSonos}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 bg-card hover:bg-accent"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted mr-4">
                    <Speaker className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Connect to Sonos</div>
                    <div className="text-sm text-muted-foreground">Sign in to control your Sonos speakers</div>
                  </div>
                </Button>
              )}

              {sonosStatus === "error" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Failed to load Sonos devices. Please try again.</AlertDescription>
                </Alert>
              )}

              {sonosStatus === "ready" && sonosDevices.length > 0 && (
                <>
                  {sonosDevices.map((device) => (
                    <Button
                      key={device.id}
                      onClick={() => handleDeviceSelect(device.id)}
                      variant="outline"
                      className={cn(
                        "w-full justify-start h-auto p-4",
                        selectedDevice === device.id
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-card hover:bg-accent border-2 border-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center mr-4",
                          selectedDevice === device.id ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <Speaker className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{device.name}</div>
                        <div className="text-sm text-muted-foreground">Sonos Speaker</div>
                      </div>
                      {selectedDevice === device.id && <Check className="w-6 h-6 text-primary" />}
                    </Button>
                  ))}
                  <Button onClick={() => refreshSonosDevices()} variant="ghost" size="sm" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Sonos Devices
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Cast Devices */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">CAST TO WIFI DEVICES</h3>
            <div className="space-y-2">
              {castStatus === "loading" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Loading Cast SDK...</AlertDescription>
                </Alert>
              )}

              {castStatus === "unavailable" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cast is not available. Please use Chrome, Edge, or Opera browser and ensure you're on HTTPS.
                  </AlertDescription>
                </Alert>
              )}

              {castStatus === "error" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cast initialization failed. Check the browser console for details.
                  </AlertDescription>
                </Alert>
              )}

              {castStatus === "ready" && (
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
                      <div className="font-semibold">Cast to a device</div>
                      <div className="text-sm text-muted-foreground">
                        Opens browser's Cast picker to find your devices
                      </div>
                    </div>
                  </Button>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">How to cast:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Click the "Cast to a device" button above</li>
                      <li>Your browser will show available Cast devices</li>
                      <li>Select your Chromecast, Google Home, or smart TV</li>
                      <li>Make sure your device is on the same WiFi network</li>
                    </ol>
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
