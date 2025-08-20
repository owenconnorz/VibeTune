"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react"
import { useAudioPlayer } from "./audio-player-context"
import { extractColorsFromImage, type ExtractedColors } from "@/lib/color-extractor"

interface ThemeContextType {
  colors: ExtractedColors
  isTransitioning: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAudioPlayer()
  const [colors, setColors] = useState<ExtractedColors>({
    primary: "#fbbf24",
    secondary: "#f59e0b",
    accent: "#d97706",
    background: "#18181b",
    foreground: "#ffffff",
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const lastThumbnailRef = useRef<string | null>(null)
  const lastTrackIdRef = useRef<string | null>(null)

  const currentThumbnail = useMemo(() => {
    if (!state.currentTrack?.id || !state.currentTrack?.thumbnail) {
      return null
    }
    return state.currentTrack.thumbnail
  }, [state.currentTrack?.id, state.currentTrack?.thumbnail])

  const currentTrackId = state.currentTrack?.id || null

  useEffect(() => {
    if (!state.currentTrack || !currentTrackId || !currentThumbnail) {
      return
    }

    if (currentTrackId === lastTrackIdRef.current && currentThumbnail === lastThumbnailRef.current) {
      return
    }

    const updateTheme = async () => {
      setIsTransitioning(true)

      lastTrackIdRef.current = currentTrackId
      lastThumbnailRef.current = currentThumbnail

      try {
        const newColors = await extractColorsFromImage(currentThumbnail)

        const root = document.documentElement
        root.style.setProperty("--theme-primary", newColors.primary)
        root.style.setProperty("--theme-secondary", newColors.secondary)
        root.style.setProperty("--theme-accent", newColors.accent)
        root.style.setProperty("--theme-background", newColors.background)
        root.style.setProperty("--theme-foreground", newColors.foreground)

        setColors(newColors)
      } catch (error) {
        console.error("Theme: Failed to extract colors:", error)
      } finally {
        setTimeout(() => setIsTransitioning(false), 500)
      }
    }

    updateTheme()
  }, [currentTrackId, currentThumbnail])

  return <ThemeContext.Provider value={{ colors, isTransitioning }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
