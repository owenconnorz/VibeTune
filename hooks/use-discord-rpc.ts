"use client"

import { useEffect } from "react"
import { useSettings } from "@/contexts/settings-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"

// Discord RPC interface for web (using Discord's web API)
interface DiscordActivity {
  details?: string
  state?: string
  startTimestamp?: number
  largeImageKey?: string
  largeImageText?: string
  smallImageKey?: string
  smallImageText?: string
}

export function useDiscordRPC() {
  const { discordRpcEnabled, isDiscordConnected, discordAccessToken } = useSettings()
  const { state } = useAudioPlayer()

  useEffect(() => {
    if (!discordRpcEnabled || !isDiscordConnected || !discordAccessToken || typeof window === "undefined") return

    const updateDiscordActivity = async () => {
      if (!state.currentTrack) {
        // Clear activity when no track is playing
        clearDiscordActivity()
        return
      }

      const activity: DiscordActivity = {
        details: state.currentTrack.title,
        state: `by ${state.currentTrack.artist}`,
        startTimestamp: Date.now(),
        largeImageKey: "vibetunelogo",
        largeImageText: "VibeTune Music App",
        smallImageKey: state.isPlaying ? "play" : "pause",
        smallImageText: state.isPlaying ? "Playing" : "Paused",
      }

      try {
        // In a real implementation, you'd send this to Discord's RPC API
        console.log("[v0] Discord RPC Activity:", activity)

        // For now, we'll use the document title as fallback
        if (state.isPlaying && state.currentTrack) {
          document.title = `🎵 ${state.currentTrack.title} - ${state.currentTrack.artist} | VibeTune`
        } else {
          document.title = "VibeTune Music App"
        }
      } catch (error) {
        console.error("[v0] Discord RPC update failed:", error)
      }
    }

    const clearDiscordActivity = () => {
      console.log("[v0] Discord RPC: Clearing activity")
      document.title = "VibeTune Music App"
    }

    // Update activity when track or play state changes
    updateDiscordActivity()

    // Set up interval to update timestamp
    const interval = setInterval(updateDiscordActivity, 15000) // Update every 15 seconds

    return () => {
      clearInterval(interval)
      if (!state.currentTrack) {
        clearDiscordActivity()
      }
    }
  }, [discordRpcEnabled, isDiscordConnected, discordAccessToken, state.currentTrack, state.isPlaying])
}
