"use client"

import type React from "react"

import { Play, Pause, User, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useTheme } from "@/contexts/theme-context"
import { useState, useCallback } from "react"
import { FullScreenPlayer } from "./full-screen-player"
import { ThumbnailImage } from "./optimized-image"
import { YouTubePlayer } from "@/components/youtube-player"
import { ErrorBoundaryComponent } from "./error-boundary"

export function AudioPlayer() {
  const { state, togglePlay, nextTrack, previousTrack, seekTo, setVolume } = useAudioPlayer()
  const { colors } = useTheme()
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    })
    setSwipeOffset(0)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault()
        setSwipeOffset(deltaX * 0.3)
      }
    },
    [touchStart],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touchStart.y - touch.clientY
      const deltaTime = Date.now() - touchStart.time
      const velocityX = Math.abs(deltaX) / deltaTime
      const velocityY = Math.abs(deltaY) / deltaTime

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && velocityX > 0.2) {
        setIsAnimating(true)

        if (deltaX > 0) {
          setSwipeOffset(300)
          setTimeout(() => {
            previousTrack()
            setSwipeOffset(0)
            setIsAnimating(false)
          }, 200)
        } else {
          setSwipeOffset(-300)
          setTimeout(() => {
            nextTrack()
            setSwipeOffset(0)
            setIsAnimating(false)
          }, 200)
        }
      } else if (deltaY > 50 && velocityY > 0.3) {
        setIsFullScreenOpen(true)
        setSwipeOffset(0)
      } else {
        setSwipeOffset(0)
      }

      setTouchStart(null)
    },
    [touchStart, nextTrack, previousTrack],
  )

  const handleTouchCancel = useCallback(() => {
    setTouchStart(null)
    setSwipeOffset(0)
  }, [])

  const getAlbumArtwork = useCallback((track: any) => {
    if (!track) {
      return "/placeholder.svg?height=40&width=40"
    }

    if (track.thumbnail && !track.thumbnail.includes("placeholder.svg")) {
      return track.thumbnail
    }

    return "/placeholder.svg?height=40&width=40"
  }, [])

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
      {state.currentTrack && (
        <div className="fixed -top-[9999px] -left-[9999px] w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
          <ErrorBoundaryComponent fallback={null}>
            <YouTubePlayer videoId={state.currentTrack.id} showVideo={false} />
          </ErrorBoundaryComponent>
        </div>
      )}

      <div className="fixed bottom-20 left-4 right-4 z-50">
        <div
          className="bg-zinc-900/95 backdrop-blur-md rounded-full border border-zinc-700/50 shadow-2xl overflow-hidden transition-transform duration-200 ease-out"
          style={{
            transform: `translateX(${swipeOffset}px)`,
            opacity: isAnimating && Math.abs(swipeOffset) > 100 ? 0.7 : 1,
          }}
        >
          <div className="w-full bg-black/20 h-0.5">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: colors.accent || "#facc15",
              }}
            />
          </div>

          <div
            className="flex items-center gap-3 px-4 py-3"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            <div className="flex-shrink-0 cursor-pointer" onClick={() => setIsFullScreenOpen(true)}>
              <ThumbnailImage
                key={state.currentTrack.id}
                src={getAlbumArtwork(state.currentTrack) || "/placeholder.svg"}
                alt={`${state.currentTrack.title} album cover`}
                size={48}
                className="rounded-full shadow-lg border-2 border-white/10 object-cover"
                priority={true}
              />
            </div>

            <div className="flex-1 min-w-0 cursor-pointer text-center" onClick={() => setIsFullScreenOpen(true)}>
              <h3 className="text-white font-semibold truncate text-sm">{state.currentTrack.title}</h3>
              <p className="text-white/70 text-xs truncate">{state.currentTrack.artist}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-white/80 hover:bg-white/10 w-10 h-10 rounded-full"
                onClick={togglePlay}
                disabled={state.isLoading}
              >
                {state.isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : state.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-white/80 hover:bg-white/10 w-10 h-10 rounded-full"
              >
                <User className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-white/80 hover:bg-white/10 w-10 h-10 rounded-full"
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {state.error && (
            <div className="px-4 pb-2">
              <p className="text-red-300 text-xs text-center">{state.error}</p>
            </div>
          )}
        </div>

        {swipeOffset !== 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`text-white/60 text-xs font-medium ${Math.abs(swipeOffset) > 100 ? "opacity-100" : "opacity-50"} transition-opacity`}
            >
              {swipeOffset > 0 ? "← Previous" : "Next →"}
            </div>
          </div>
        )}
      </div>

      <FullScreenPlayer isOpen={isFullScreenOpen} onClose={() => setIsFullScreenOpen(false)} />
    </>
  )
}
