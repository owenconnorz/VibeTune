"use client"

import type React from "react"
import { useEffect } from "react"
import { useState, useRef, useCallback } from "react"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Share,
  MoreHorizontal,
  List,
  Moon,
  BarChart3,
  Repeat,
  Video,
  Music,
  Maximize,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useTheme } from "@/contexts/theme-context"
import { useLikedSongs } from "@/contexts/liked-songs-context"
import { CanvasBackground } from "@/components/canvas-background"
import { ErrorBoundaryComponent } from "./error-boundary"

interface FullScreenPlayerProps {
  isOpen: boolean
  onClose: () => void
}

export function FullScreenPlayer({ isOpen, onClose }: FullScreenPlayerProps) {
  const { state, togglePlay, nextTrack, previousTrack, seekTo, setVideoMode } = useAudioPlayer()
  const { colors, isTransitioning } = useTheme()
  const { isLiked, toggleLike } = useLikedSongs()
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)
  const [canvasSettings, setCanvasSettings] = useState({ enableCanvas: false })
  const canvasInitializedRef = useRef(false)

  useEffect(() => {
    if (!canvasInitializedRef.current) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const saved = localStorage.getItem("vibetuneVideoSettings")
          if (saved) {
            const settings = JSON.parse(saved)
            const enableCanvas = settings.enableCanvas || false
            setCanvasSettings((prev) => (prev.enableCanvas !== enableCanvas ? { enableCanvas } : prev))
          }
        }
      } catch (error) {
        console.error("Failed to load canvas settings:", error)
        setCanvasSettings((prev) => (prev.enableCanvas !== false ? { enableCanvas: false } : prev))
      }
      canvasInitializedRef.current = true
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    startY.current = touch.clientY
    lastY.current = touch.clientY
    lastTime.current = Date.now()
    velocity.current = 0
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const touch = e.touches[0]
      const currentY = touch.clientY
      const deltaY = currentY - startY.current
      const currentTime = Date.now()

      const timeDelta = currentTime - lastTime.current
      if (timeDelta > 0) {
        velocity.current = (currentY - lastY.current) / timeDelta
      }

      lastY.current = currentY
      lastTime.current = currentTime

      if (deltaY > 0) {
        setDragY(Math.min(deltaY, window.innerHeight * 0.8))
      }
    },
    [isDragging],
  )

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return

    const shouldClose = dragY > 100 || (dragY > 50 && velocity.current > 0.5)

    if (shouldClose) {
      onClose()
    }

    setDragY(0)
    setIsDragging(false)
    velocity.current = 0
  }, [dragY, isDragging, onClose])

  const handleTouchCancel = useCallback(() => {
    setDragY(0)
    setIsDragging(false)
    velocity.current = 0
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleToggleLike = useCallback(() => {
    try {
      if (state.currentTrack) {
        toggleLike({
          id: state.currentTrack.id,
          title: state.currentTrack.title,
          artist: state.currentTrack.artist,
          thumbnail: state.currentTrack.thumbnail,
          duration: state.currentTrack.duration,
        })
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }, [state.currentTrack, toggleLike])

  const handleToggleVideoMode = useCallback(() => {
    try {
      setVideoMode(!state.isVideoMode)
    } catch (error) {
      console.error("Failed to toggle video mode:", error)
    }
  }, [state.isVideoMode, setVideoMode])

  const handleToggleFullscreen = useCallback(() => {
    if (!state.isVideoMode) return // Only allow fullscreen for videos

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen()
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
      }
      setIsFullscreen(!isFullscreen)
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error)
    }
  }, [isFullscreen, state.isVideoMode])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const isEpornerVideo = !!(
    state.currentTrack &&
    (state.currentTrack.isVideo || state.currentTrack.videoUrl) &&
    (state.currentTrack.id?.startsWith("eporner_") ||
      state.currentTrack.videoUrl?.includes("eporner.com") ||
      state.currentTrack.source === "eporner")
  )

  useEffect(() => {
    if (isEpornerVideo && !state.isVideoMode) {
      console.log("[v0] Force enabling video mode for eporner video:", state.currentTrack?.title)
      setVideoMode(true)
    }
  }, [isEpornerVideo, state.isVideoMode, state.currentTrack?.title, setVideoMode])

  const getEpornerEmbedUrl = useCallback(() => {
    if (!state.currentTrack || !isEpornerVideo) return null

    console.log("[v0] Getting eporner embed URL for track:", state.currentTrack)

    if (state.currentTrack.videoUrl) {
      console.log("[v0] Original video URL:", state.currentTrack.videoUrl)

      // If it's already an embed URL, use it directly
      if (state.currentTrack.videoUrl.includes("eporner.com/embed/")) {
        console.log("[v0] Using existing embed URL:", state.currentTrack.videoUrl)
        return state.currentTrack.videoUrl
      }

      // Try to extract video ID from various URL formats
      let videoId = null

      // Extract from video page URL (e.g., https://www.eporner.com/video-abc123/title)
      const videoMatch = state.currentTrack.videoUrl.match(/\/video-([^/]+)\//)
      if (videoMatch) {
        videoId = videoMatch[1]
        console.log("[v0] Extracted video ID from video URL:", videoId)
      }

      // Extract from direct eporner URLs
      if (!videoId) {
        const idMatch = state.currentTrack.videoUrl.match(/eporner\.com\/.*?([a-zA-Z0-9]{8,})/)
        if (idMatch) {
          videoId = idMatch[1]
          console.log("[v0] Extracted video ID from general URL:", videoId)
        }
      }

      if (videoId) {
        const embedUrl = `https://www.eporner.com/embed/${videoId}`
        console.log("[v0] Generated embed URL:", embedUrl)
        return embedUrl
      }
    }

    // Fallback to using the track ID if it's an eporner video
    if (state.currentTrack.id?.startsWith("eporner_")) {
      const videoId = state.currentTrack.id.replace("eporner_", "")
      const embedUrl = `https://www.eporner.com/embed/${videoId}`
      console.log("[v0] Using track ID for embed URL:", embedUrl)
      return embedUrl
    }

    console.log("[v0] Could not generate embed URL for track")
    return null
  }, [state.currentTrack, isEpornerVideo])

  if (!isOpen || !state.currentTrack || !colors) return null

  const progressPercentage = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  const dynamicBackground = `linear-gradient(135deg, ${colors.primary || "#1a1a1a"} 0%, ${colors.secondary || "#2a2a2a"} 50%, ${colors.accent || "#3a3a3a"} 100%)`

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 overflow-hidden ${
        isDragging ? "" : "transition-all duration-500 ease-out"
      } ${isTransitioning ? "transition-all duration-500" : ""}`}
      style={{
        background: dynamicBackground,
        transform: `translateY(${dragY}px)`,
        opacity: isDragging ? Math.max(0.7, 1 - dragY / 400) : 1,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="touch-none select-none">
        <div className="flex items-center justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4">
          <div className="text-center">
            <h1 className="text-white text-lg sm:text-xl font-semibold">Now Playing</h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1">
              {isEpornerVideo ? "VIDEO MODE" : state.isVideoMode ? "VIDEO MODE" : "AUDIO MODE"}
            </p>
          </div>
        </div>

        <div className="flex justify-center mb-4 sm:mb-8">
          <div className="w-12 h-1 bg-white/30 rounded-full"></div>
        </div>

        <div className="flex justify-center px-4 sm:px-8 mb-6 sm:mb-8">
          <div className="w-full max-w-md">
            {!isEpornerVideo && (
              <div className="flex justify-center mb-4 gap-2">
                <Button
                  variant="ghost"
                  className={`${
                    state.isVideoMode
                      ? "text-white bg-white/20 border-white/30"
                      : "text-white/80 bg-white/10 border-white/20"
                  } hover:text-white hover:bg-white/25 rounded-full px-6 py-2 border transition-all duration-200 flex items-center gap-2`}
                  onClick={handleToggleVideoMode}
                >
                  {state.isVideoMode ? (
                    <>
                      <Video className="w-4 h-4" />
                      <span className="text-sm font-medium">Video</span>
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4" />
                      <span className="text-sm font-medium">Audio</span>
                    </>
                  )}
                </Button>

                {state.isVideoMode && (
                  <Button
                    variant="ghost"
                    className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 border border-white/20 transition-all duration-200 flex items-center gap-2"
                    onClick={handleToggleFullscreen}
                  >
                    <Maximize className="w-4 h-4" />
                    <span className="text-sm font-medium">{isFullscreen ? "Exit" : "Fullscreen"}</span>
                  </Button>
                )}
              </div>
            )}

            <div className="relative">
              {isEpornerVideo ? (
                <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-black">
                  <ErrorBoundaryComponent
                    fallback={
                      <div className="w-full h-full bg-black flex items-center justify-center text-white">
                        <div className="text-center">
                          <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Video unavailable</p>
                          <p className="text-sm text-white/60 mt-2">Unable to load eporner content</p>
                        </div>
                      </div>
                    }
                  >
                    {getEpornerEmbedUrl() ? (
                      <iframe
                        src={getEpornerEmbedUrl()!}
                        className="w-full h-full border-0 relative z-20"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen; microphone; camera"
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-autoplay"
                        loading="eager"
                        title={state.currentTrack.title}
                        referrerPolicy="no-referrer"
                        autoPlay={true}
                        onLoad={() => {
                          console.log("[v0] Eporner iframe loaded successfully")
                        }}
                        onError={(e) => {
                          console.error("[v0] Eporner iframe failed to load:", e)
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center text-white">
                        <div className="text-center">
                          <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Video format not supported</p>
                          <p className="text-sm text-white/60 mt-2">Unable to create embed URL</p>
                          <p className="text-xs text-white/40 mt-1">Video ID: {state.currentTrack.id}</p>
                          <p className="text-xs text-white/40 mt-1">URL: {state.currentTrack.videoUrl}</p>
                        </div>
                      </div>
                    )}
                  </ErrorBoundaryComponent>
                </div>
              ) : state.isVideoMode ? (
                <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-black">
                  <ErrorBoundaryComponent
                    fallback={
                      <div className="w-full h-full bg-black flex items-center justify-center text-white">
                        Video unavailable
                      </div>
                    }
                  >
                    <div className="w-full h-full bg-black flex items-center justify-center text-white">
                      <p>Video format not supported</p>
                    </div>
                  </ErrorBoundaryComponent>
                </div>
              ) : (
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 max-w-[90vw] max-h-[40vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl mx-auto">
                  <ErrorBoundaryComponent fallback={null}>
                    <CanvasBackground isEnabled={canvasSettings.enableCanvas} className="rounded-2xl sm:rounded-3xl" />
                  </ErrorBoundaryComponent>
                  <img
                    src={state.currentTrack.thumbnail || "/placeholder.svg"}
                    alt={`${state.currentTrack.title} album cover`}
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-white text-4xl sm:text-6xl font-bold opacity-20 transform rotate-12">
                      {state.currentTrack.artist?.toUpperCase() || "UNKNOWN"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 mb-4 sm:mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-xl sm:text-2xl font-bold mb-1 leading-tight line-clamp-2">
                {state.currentTrack.title}
              </h2>
              <p className="text-white/80 text-base sm:text-lg truncate">{state.currentTrack.artist}</p>
              {isEpornerVideo && (
                <p className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                  Adult Video Content
                </p>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12"
              >
                <Share className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12"
                onClick={handleToggleLike}
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    state.currentTrack && isLiked(state.currentTrack.id) ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>

        {!isEpornerVideo && (
          <div className="px-4 sm:px-8 mb-6 sm:mb-6">
            <div className="relative">
              <Slider
                value={[progressPercentage]}
                onValueChange={(value) => {
                  const newTime = (value[0] / 100) * state.duration
                  seekTo(newTime)
                }}
                max={100}
                step={0.1}
                className="w-full [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 sm:[&_[role=slider]]:h-5 sm:[&_[role=slider]]:w-5"
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-white/60 text-sm">{formatTime(state.currentTime)}</span>
              <span className="text-white/60 text-sm">{formatTime(state.duration)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 sm:gap-6 px-4 sm:px-8 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-14 h-14 sm:w-16 sm:h-16"
            onClick={previousTrack}
            disabled={state.currentIndex <= 0}
          >
            <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>

          {!isEpornerVideo && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white bg-white/20 hover:bg-white/30 rounded-full w-16 h-16 sm:w-20 sm:h-20"
              onClick={togglePlay}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : state.isPlaying ? (
                <Pause className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <Play className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-14 h-14 sm:w-16 sm:h-16"
            onClick={nextTrack}
            disabled={state.currentIndex >= state.queue.length - 1}
          >
            <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        <div className="flex items-center justify-between px-6 sm:px-8 pb-6 sm:pb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
          >
            <List className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
          >
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
          >
            <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
          >
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
