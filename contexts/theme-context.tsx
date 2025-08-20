"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
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

  useEffect(() => {
    if (!state.currentTrack?.thumbnail) return

    const updateTheme = async () => {
      setIsTransitioning(true)

      try {
        const newColors = await extractColorsFromImage(state.currentTrack.thumbnail)

        // Apply colors to CSS custom properties for smooth transitions
        const root = document.documentElement
        root.style.setProperty("--theme-primary", newColors.primary)
        root.style.setProperty("--theme-secondary", newColors.secondary)
        root.style.setProperty("--theme-accent", newColors.accent)
        root.style.setProperty("--theme-background", newColors.background)
        root.style.setProperty("--theme-foreground", newColors.foreground)

        setColors(newColors)
      } catch (error) {
        console.error("Failed to extract colors:", error)
      } finally {
        setTimeout(() => setIsTransitioning(false), 500)
      }
    }

    updateTheme()
  }, [state.currentTrack])

  return <ThemeContext.Provider value={{ colors, isTransitioning }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
