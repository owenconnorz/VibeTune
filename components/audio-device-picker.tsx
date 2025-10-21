"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Smartphone, Wifi, Bluetooth, Speaker, Laptop, Check, Radio, RefreshCw, Cast, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AudioDevice {
  id: string
  name: string
  type: "phone" | "wifi" | "bluetooth" | "computer" | "speaker" | "cast"
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
  const [castAvailable, setCastAvailable] = useState(false)
  const [bluetoothDevices, setBluetoothDevices] = useState<AudioDevice[]>([])
  const [showBluetoothHelp, setShowBluetoothHelp] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadDevices()
    initializeCast()
  }, [])

  const initializeCast = () => {
    if (window.chrome && window.chrome.cast) {
      console.log("[v0] Google Cast API is available")
      setCastAvailable(true)
      initializeCastApi()
    } else {
      console.log("[v0] Google Cast API not available, loading SDK...")
      const script = document.createElement("script")
      script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
      script.onload = () => {
        console.log("[v0] Cast SDK loaded")
        setCastAvailable(true)
        setTimeout(() => {
          initializeCastApi()
        }, 1000)
      }
      script.onerror = () => {
        console.log("[v0] Failed to load Cast SDK")
      }
      document.head.appendChild(script)
    }
  }

  const initializeCastApi = () => {
    if (!window.chrome?.cast?.isAvailable) {
      console.log("[v0] Cast API not ready yet")
      return
    }

    try {
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
            scanForCastDevices()
          }
        },
      )

      window.chrome.cast.initialize(
        apiConfig,
        () => {
          console.log("[v0] Cast API initialized successfully")
          scanForCastDevices()
        },
        (error: any) => {
          console.log("[v0] Cast API initialization error:", error)
        },
      )
    } catch (error) {
      console.log("[v0] Error initializing Cast API:", error)
    }
  }

  const scanForCastDevices = () => {
    console.log("[v0] Scanning for Cast devices...")
    if (castAvailable) {
      setDevices((prev) => {
        const hasCastDevice = prev.some((d) => d.type === "cast")
        if (!hasCastDevice) {
          return [
            ...prev,
            {
              id: "cast-device",
              name: "Cast to Device",
              type: "cast",
              connected: false,
              available: true,
            },
          ]
        }
        return prev
      })
    }
  }

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
        console.log("[v0] Enumerating audio devices...")

        const mediaDevices = await navigator.mediaDevices.enumerateDevices()
        console.log("[v0] Total media devices found:", mediaDevices.length)

        const audioOutputs = mediaDevices.filter((device) => device.kind === "audiooutput")
        console.log("[v0] Audio output devices found:", audioOutputs.length)

        const detectedDevices: AudioDevice[] = []
        const bluetoothDevs: AudioDevice[] = []

        audioOutputs.forEach((device) => {
          if (device.deviceId === "default" || device.deviceId === "communications") {
            return
          }

          const deviceType = detectDeviceType(device.label)
          const deviceInfo: AudioDevice = {
            id: device.deviceId,
            name: device.label || "Unknown Audio Device",
            type: deviceType,
            connected: false,
            available: true,
          }

          console.log("[v0] Detected device:", device.label, "→ Type:", deviceType)

          if (deviceType === "bluetooth") {
            bluetoothDevs.push(deviceInfo)
          }

          detectedDevices.push(deviceInfo)
        })

        console.log("[v0] Bluetooth devices found:", bluetoothDevs.length)
        setBluetoothDevices(bluetoothDevs)
        setDevices([...defaultDevices, ...detectedDevices])

        if (bluetoothDevs.length === 0) {
          console.log("[v0] No Bluetooth devices detected. User may need to pair devices first.")
        }
      } catch (error) {
        console.error("[v0] Error enumerating devices:", error)
        setDevices(defaultDevices)
      }
    } else {
      console.log("[v0] MediaDevices API not supported in this browser")
      setDevices(defaultDevices)
    }

    setScanning(false)
  }

  const detectDeviceType = (label: string): AudioDevice["type"] => {
    const lowerLabel = label.toLowerCase()

    const bluetoothKeywords = [
      "bluetooth",
      "bt",
      "airpods",
      "buds",
      "headphone",
      "headset",
      "earphone",
      "earbud",
      "wireless",
      "jbl",
      "bose",
      "sony",
      "beats",
      "jabra",
      "sennheiser",
      "anker",
      "soundcore",
    ]

    if (bluetoothKeywords.some((keyword) => lowerLabel.includes(keyword))) {
      return "bluetooth"
    }

    if (lowerLabel.includes("speaker") || lowerLabel.includes("audio")) return "speaker"
    if (lowerLabel.includes("wifi") || lowerLabel.includes("network")) return "wifi"
    if (lowerLabel.includes("cast") || lowerLabel.includes("chromecast")) return "cast"
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
      case "cast":
        return Cast
      default:
        return Speaker
    }
  }

  const handleDeviceSelect = async (deviceId: string) => {
    console.log("[v0] Selecting device:", deviceId)
    setSelectedDevice(deviceId)

    if (deviceId === "cast-device") {
      try {
        if (window.chrome?.cast?.isAvailable) {
          window.chrome.cast.requestSession(
            (session: any) => {
              console.log("[v0] Cast session established:", session)
              setDevices((prev) =>
                prev.map((device) => ({
                  ...device,
                  connected: device.id === deviceId,
                })),
              )
            },
            (error: any) => {
              console.log("[v0] Cast session error:", error)
            },
          )
        }
      } catch (error) {
        console.log("[v0] Error requesting Cast session:", error)
      }
      return
    }

    if (deviceId !== "this-device") {
      try {
        const audioElements = document.querySelectorAll("audio")
        const videoElements = document.querySelectorAll("video")

        console.log("[v0] Found audio elements:", audioElements.length)
        console.log("[v0] Found video elements:", videoElements.length)

        for (const element of audioElements) {
          if ("setSinkId" in element) {
            await (element as any).setSinkId(deviceId)
            console.log("[v0] Audio output set to:", deviceId)
          } else {
            console.log("[v0] setSinkId not supported on this audio element")
          }
        }

        for (const element of videoElements) {
          if ("setSinkId" in element) {
            await (element as any).setSinkId(deviceId)
            console.log("[v0] Video audio output set to:", deviceId)
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
      console.log("[v0] Resetting to default device")
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
    if (castAvailable) {
      scanForCastDevices()
    }
  }

  if (!mounted) return null

  const availableDevices = devices.filter((device) => device.id !== "this-device")
  const bluetoothAvailableDevices = availableDevices.filter((d) => d.type === "bluetooth")
  const otherDevices = availableDevices.filter((d) => d.type !== "bluetooth")

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl font-semibold">Select a device</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">Play music on your speakers, TV, or other devices</p>
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

          {bluetoothAvailableDevices.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  BLUETOOTH DEVICES ({bluetoothAvailableDevices.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBluetoothHelp(!showBluetoothHelp)}
                  className="h-6 px-2"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>

              {showBluetoothHelp && (
                <Alert className="mb-3 bg-blue-500/10 border-blue-500/20">
                  <Bluetooth className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-xs">
                    Bluetooth devices must be paired in your device settings first. After pairing, refresh this list to
                    see them here.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {bluetoothAvailableDevices.map((device) => {
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
                          <Bluetooth className="w-3 h-3" />
                          <span>Bluetooth</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-6 h-6 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {otherDevices.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                OTHER DEVICES ({otherDevices.length})
              </h3>
              <div className="space-y-2">
                {otherDevices.map((device) => {
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
                          {device.type === "wifi" && "WiFi"}
                          {device.type === "speaker" && "Speaker"}
                          {device.type === "computer" && "Computer"}
                          {device.type === "cast" && "Google Cast"}
                        </div>
                      </div>
                      {isSelected && <Check className="w-6 h-6 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {availableDevices.length === 0 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center space-y-3">
                <Bluetooth className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <h4 className="font-semibold">No devices found</h4>
                <p className="text-sm text-muted-foreground">
                  Pair Bluetooth devices in your device settings, then refresh this list
                </p>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4 bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan Again
                </Button>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Bluetooth className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm space-y-2">
                  <p className="font-semibold">How to connect Bluetooth devices:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs ml-2">
                    <li>Open your device's Settings app</li>
                    <li>Go to Bluetooth settings</li>
                    <li>Turn on Bluetooth if it's off</li>
                    <li>Put your speaker/headphones in pairing mode</li>
                    <li>Select the device from the list to pair</li>
                    <li>Return here and tap "Scan Again"</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">Device Connection Guide</h4>
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="space-y-1">
                <p className="font-semibold flex items-center gap-2">
                  <Bluetooth className="w-3 h-3" />
                  Bluetooth Devices
                </p>
                <p className="ml-5">
                  Pair in your device settings first. Once paired, they'll appear here automatically. Refresh the list
                  after pairing.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold flex items-center gap-2">
                  <Cast className="w-3 h-3" />
                  Chromecast / Google Cast
                </p>
                <p className="ml-5">
                  Devices on the same WiFi network should appear automatically. Make sure your Cast device is powered
                  on.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold flex items-center gap-2">
                  <Wifi className="w-3 h-3" />
                  Other WiFi Speakers
                </p>
                <p className="ml-5">
                  AirPlay, Sonos, and other WiFi speakers require their manufacturer's app and cannot be controlled
                  directly from web browsers.
                </p>
              </div>

              <p className="mt-3 pt-3 border-t border-border text-xs">
                <strong>Note:</strong> Device names may show as "Unknown" without additional permissions. This is normal
                and doesn't affect functionality.
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
