"use client"

import type React from "react"

import { Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useTheme } from "@/contexts/theme-context"
import { useState, useCallback } from "react"
import { FullScreenPlayer } from "./full-screen-player"

export function AudioPlayer() {
  const { state, togglePlay, nextTrack, seekTo, setVolume } = useAudioPlayer()
  const { colors } = useTheme()
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<{ y: number; time: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({
      y: touch.clientY,
      time: Date.now(),
    })
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart) return

      const touch = e.changedTouches[0]
      const deltaY = touchStart.y - touch.clientY
      const deltaTime = Date.now() - touchStart.time
      const velocity = Math.abs(deltaY) / deltaTime

      if (deltaY > 50 && velocity > 0.3) {
        console.log("[v0] Mini player swipe up detected, opening full-screen player")
        setIsFullScreenOpen(true)
      }

      setTouchStart(null)
    },
    [touchStart],
  )

  const handleTouchCancel = useCallback(() => {
    setTouchStart(null)
  }, [])

  console.log("[v0] Mini player colors:", colors)
  console.log("[v0] Current track:", state.currentTrack?.title, "Thumbnail:", state.currentTrack?.thumbnail)

  if (!state.currentTrack) {
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  return (
    <>
      <div
        className="fixed bottom-12 left-0 right-0 border-t border-zinc-700 transition-all duration-500"
        style={{
          background: colors.primary
            ? `linear-gradient(135deg, ${colors.primary}dd, ${colors.secondary || colors.primary}dd)`
            : undefined,
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Progress Bar */}
        <div className="w-full bg-black/20 h-0.5">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: colors.accent || "#facc15",
            }}
          />
        </div>

        <div className="flex items-center gap-3 p-3">
          {/* Track Info */}
          <div
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer touch-none"
            onClick={() => setIsFullScreenOpen(true)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            <img
              src={state.currentTrack.thumbnail || "/placeholder.svg"}
              alt={`${state.currentTrack.title} album cover`}
              className="w-10 h-10 rounded-md object-cover shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold truncate drop-shadow-sm text-sm">{state.currentTrack.title}</h3>
              <p className="text-white/70 text-xs truncate drop-shadow-sm">{state.currentTrack.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white/80 bg-white/10 hover:bg-white/20 backdrop-blur-sm w-8 h-8"
              onClick={togglePlay}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : state.isPlaying ? (
                <Pause className="w-4 h-4 drop-shadow-sm" />
              ) : (
                <Play className="w-4 h-4 drop-shadow-sm" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white/80 hover:bg-white/10 w-8 h-8"
              onClick={nextTrack}
              disabled={state.currentIndex >= state.queue.length - 1}
            >
              <SkipForward className="w-4 h-4 drop-shadow-sm" />
            </Button>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white/80 hover:bg-white/10 w-8 h-8"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            >
              {state.volume === 0 ? (
                <VolumeX className="w-4 h-4 drop-shadow-sm" />
              ) : (
                <Volume2 className="w-4 h-4 drop-shadow-sm" />
              )}
            </Button>

            {showVolumeSlider && (
              <div className="absolute bottom-full right-0 mb-2 bg-black/50 backdrop-blur-md rounded-lg p-2 w-28 border border-white/10">
                <Slider
                  value={[state.volume * 100]}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="px-3 pb-1">
            <p className="text-red-300 text-xs drop-shadow-sm">{state.error}</p>
          </div>
        )}
      </div>

      {/* Full Screen Player */}
      <FullScreenPlayer isOpen={isFullScreenOpen} onClose={() => setIsFullScreenOpen(false)} />
    </>
  )
}
