"use client"

import type React from "react"
import { sonosAPI, type SonosDevice } from "@/lib/sonos-api"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

interface CastContextType {
  castAvailable: boolean
  castStatus: "loading" | "ready" | "unavailable" | "error"
  requestCast: () => void
  sonosAvailable: boolean
  sonosStatus: "loading" | "ready" | "unavailable" | "error"
  sonosDevices: SonosDevice[]
  requestSonos: () => void
  refreshSonosDevices: () => Promise<void>
}

const CastContext = createContext<CastContextType>({
  castAvailable: false,
  castStatus: "loading",
  requestCast: () => {},
  sonosAvailable: false,
  sonosStatus: "loading",
  sonosDevices: [],
  requestSonos: () => {},
  refreshSonosDevices: async () => {},
})

export function useCast() {
  return useContext(CastContext)
}

export function CastProvider({ children }: { children: React.ReactNode }) {
  const [castAvailable, setCastAvailable] = useState(false)
  const [castStatus, setCastStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading")

  const [sonosAvailable, setSonosAvailable] = useState(false)
  const [sonosStatus, setSonosStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading")
  const [sonosDevices, setSonosDevices] = useState<SonosDevice[]>([])

  const requestCast = useCallback(() => {
    console.log("[v0] [Cast] User requested Cast picker")

    if (typeof window === "undefined") {
      console.log("[v0] [Cast] Not in browser environment")
      return
    }

    const cast = (window as any).chrome?.cast
    if (!cast) {
      console.log("[v0] [Cast] Cast SDK not available")
      alert("Cast is not available. Please use Chrome, Edge, or Opera browser.")
      return
    }

    try {
      console.log("[v0] [Cast] Opening Cast picker dialog...")
      cast.requestSession(
        (session: any) => {
          console.log("[v0] [Cast] ✓ Session established:", session.sessionId)
          alert(`Connected to: ${session.receiver.friendlyName}`)
        },
        (error: any) => {
          console.log("[v0] [Cast] Session request error:", error)
          if (error.code !== "cancel") {
            alert("Failed to connect to Cast device. Make sure your device is on the same WiFi network.")
          }
        },
      )
    } catch (error) {
      console.error("[v0] [Cast] Error requesting session:", error)
      alert("Failed to open Cast picker. Please try again.")
    }
  }, [])

  useEffect(() => {
    console.log("[v0] [Cast] CastProvider mounted - initializing Cast SDK")

    // Check browser compatibility
    const isChromeBased = /Chrome|Chromium|Edge|Opera/.test(navigator.userAgent)
    if (!isChromeBased) {
      console.log("[v0] [Cast] ✗ Browser not compatible (needs Chrome, Edge, or Opera)")
      setCastStatus("unavailable")
      return
    }
    console.log("[v0] [Cast] ✓ Browser is compatible")

    // Check if Cast SDK is already loaded
    if ((window as any).chrome?.cast) {
      console.log("[v0] [Cast] ✓ Cast SDK already loaded")
      initializeCast()
      return
    }

    // Load Cast SDK script
    console.log("[v0] [Cast] Loading Cast SDK script...")
    const script = document.createElement("script")
    script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
    script.async = true

    script.onload = () => {
      console.log("[v0] [Cast] ✓ Cast SDK script loaded")
      initializeCast()
    }

    script.onerror = () => {
      console.error("[v0] [Cast] ✗ Failed to load Cast SDK script")
      setCastStatus("error")
    }

    document.head.appendChild(script)

    return () => {
      console.log("[v0] [Cast] CastProvider unmounting")
    }
  }, [])

  const requestSonos = useCallback(() => {
    if (!sonosAPI.isAuthenticated()) {
      // Trigger OAuth flow
      alert(
        "You'll be redirected to Sonos to authorize this app. After authorization, we'll discover your Sonos devices.",
      )
      sonosAPI.authenticate()
    } else {
      refreshSonosDevices()
    }
  }, [])

  const refreshSonosDevices = useCallback(async () => {
    if (!sonosAPI.isAuthenticated()) {
      setSonosStatus("unavailable")
      return
    }

    try {
      setSonosStatus("loading")
      const households = await sonosAPI.fetchHouseholds()

      if (households.length === 0) {
        setSonosStatus("unavailable")
        return
      }

      // Fetch devices from first household
      const devices = await sonosAPI.fetchGroups(households[0].id)
      setSonosDevices(devices)
      setSonosAvailable(devices.length > 0)
      setSonosStatus(devices.length > 0 ? "ready" : "unavailable")
    } catch (error) {
      console.error("Error refreshing Sonos devices:", error)
      setSonosStatus("error")
    }
  }, [])

  useEffect(() => {
    // Try to load stored Sonos token
    if (sonosAPI.loadStoredToken()) {
      refreshSonosDevices()
    } else {
      setSonosStatus("unavailable")
    }
  }, [refreshSonosDevices])

  const initializeCast = () => {
    console.log("[v0] [Cast] Initializing Cast SDK...")

    const checkCastReady = setInterval(() => {
      const cast = (window as any).chrome?.cast
      if (cast && cast.isAvailable) {
        console.log("[v0] [Cast] ✓ Cast API is available")
        clearInterval(checkCastReady)

        try {
          // Initialize Cast context
          const sessionRequest = new cast.SessionRequest(cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID)
          const apiConfig = new cast.ApiConfig(
            sessionRequest,
            (session: any) => {
              console.log("[v0] [Cast] ✓ Session listener triggered:", session.sessionId)
            },
            (availability: string) => {
              console.log("[v0] [Cast] Receiver availability changed:", availability)
              const isAvailable = availability === cast.ReceiverAvailability.AVAILABLE
              setCastAvailable(isAvailable)
              setCastStatus(isAvailable ? "ready" : "unavailable")

              if (isAvailable) {
                console.log("[v0] [Cast] ✓ Cast receivers are available on your network")
              } else {
                console.log("[v0] [Cast] ✗ No Cast receivers found on your network")
              }
            },
          )

          cast.initialize(
            apiConfig,
            () => {
              console.log("[v0] [Cast] ✓ Cast SDK initialized successfully")
              setCastStatus("ready")
            },
            (error: any) => {
              console.error("[v0] [Cast] ✗ Cast initialization error:", error)
              setCastStatus("error")
            },
          )
        } catch (error) {
          console.error("[v0] [Cast] ✗ Error during Cast initialization:", error)
          setCastStatus("error")
        }
      }
    }, 100)

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkCastReady)
      if (castStatus === "loading") {
        console.log("[v0] [Cast] ✗ Cast SDK initialization timeout")
        setCastStatus("unavailable")
      }
    }, 10000)
  }

  return (
    <CastContext.Provider
      value={{
        castAvailable,
        castStatus,
        requestCast,
        sonosAvailable,
        sonosStatus,
        sonosDevices,
        requestSonos,
        refreshSonosDevices,
      }}
    >
      {children}
    </CastContext.Provider>
  )
}
