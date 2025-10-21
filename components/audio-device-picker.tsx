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

  useEffect(() => {
    setMounted(true)
    loadDevices()
    initializeCast()
  }, [])

  const initializeCast = () => {
    // Check if Cast API is available
    if (window.chrome && window.chrome.cast) {
      console.log("[v0] Google Cast API is available")
      setCastAvailable(true)
      initializeCastApi()
    } else {
      console.log("[v0] Google Cast API not available, loading SDK...")
      // Load Cast SDK
      const script = document.createElement("script")
      script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
      script.onload = () => {
        console.log("[v0] Cast SDK loaded")
        setCastAvailable(true)
        // Wait for API to initialize
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
    // Note: The Cast API doesn't provide a direct way to list devices
    // Devices are discovered automatically by the Cast SDK
    // We can only show that Cast is available
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

    // Try to enumerate audio output devices using Web Audio API
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        console.log("[v0] Enumerating audio devices without requesting microphone permission...")

        const mediaDevices = await navigator.mediaDevices.enumerateDevices()
        console.log("[v0] Total media devices found:", mediaDevices.length)
        console.log(
          "[v0] All devices:",
          mediaDevices.map((d) => ({ kind: d.kind, label: d.label, id: d.deviceId })),
        )

        const audioOutputs = mediaDevices.filter((device) => device.kind === "audiooutput")
        console.log("[v0] Audio output devices found:", audioOutputs.length)
        audioOutputs.forEach((device) => {
          console.log("[v0] Audio output:", {
            label: device.label,
            deviceId: device.deviceId,
            groupId: device.groupId,
          })
        })

        const detectedDevices: AudioDevice[] = audioOutputs
          .filter((device) => device.deviceId !== "default" && device.deviceId !== "communications")
          .map((device) => {
            const deviceType = detectDeviceType(device.label)
            console.log("[v0] Mapped device:", device.label, "→ Type:", deviceType)
            return {
              id: device.deviceId,
              name: device.label || "Unknown Audio Device",
              type: deviceType,
              connected: false,
              available: true,
            }
          })

        console.log("[v0] Detected devices after filtering:", detectedDevices.length)
        setDevices([...defaultDevices, ...detectedDevices])
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
    if (lowerLabel.includes("bluetooth") || lowerLabel.includes("bt")) return "bluetooth"
    if (lowerLabel.includes("airpods") || lowerLabel.includes("buds") || lowerLabel.includes("headphone")) {
      return "bluetooth"
    }
    if (lowerLabel.includes("speaker") || lowerLabel.includes("audio")) return "speaker"
    if (lowerLabel.includes("wifi") || lowerLabel.includes("wireless") || lowerLabel.includes("network")) {
      return "wifi"
    }
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

    // Handle Cast device selection
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

    // Try to set the audio output device using setSinkId (if supported)
    if (deviceId !== "this-device") {
      try {
        // Get all audio elements
        const audioElements = document.querySelectorAll("audio")
        const videoElements = document.querySelectorAll("video")

        console.log("[v0] Found audio elements:", audioElements.length)
        console.log("[v0] Found video elements:", videoElements.length)

        // Set sink ID for all audio/video elements
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
          {availableDevices.length > 0 ? (
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
                        <div className="text-sm text-muted-foreground">
                          {device.type === "bluetooth" && "Bluetooth"}
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
          ) : (
            <div className="bg-muted/50 rounded-lg p-6 text-center space-y-2">
              <Wifi className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h4 className="font-semibold">No devices found</h4>
              <p className="text-sm text-muted-foreground">
                Make sure your devices are turned on and connected to the same network
              </p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4 bg-transparent">
                <RefreshCw className="w-4 h-4 mr-2" />
                Scan Again
              </Button>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">About WiFi Audio Devices</h4>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Why aren't my WiFi speakers showing up?</strong>
              </p>
              <p>Web browsers have limited access to network devices for security reasons. Here's what works:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Bluetooth:</strong> Pair in your device settings first, then refresh this list
                </li>
                <li>
                  <strong>Chromecast/Google Cast:</strong> Should appear automatically if on same WiFi
                </li>
                <li>
                  <strong>AirPlay speakers:</strong> Only work on iOS/Mac Safari (not available in web apps)
                </li>
                <li>
                  <strong>Other WiFi speakers:</strong> Require their manufacturer's app (Sonos, Bose, etc.)
                </li>
              </ul>
              <p className="mt-2 pt-2 border-t border-border">
                <strong>Note:</strong> Device names may show as "Unknown" without additional permissions. Bluetooth
                devices must be paired in your device settings first.
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
