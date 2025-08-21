"use client"

import { useEffect, useRef } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"

interface YouTubePlayerProps {
  videoId: string
  onReady?: () => void
  onStateChange?: (state: number) => void
  onError?: (error: any) => void
  showVideo?: boolean
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function YouTubePlayer({ videoId, onReady, onStateChange, onError, showVideo = false }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDestroyedRef = useRef(false)
  const { state } = useAudioPlayer()

  const isVideoMode = showVideo || state.isVideoMode

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  useEffect(() => {
    function initializePlayer() {
      if (containerRef.current && !playerRef.current && !isDestroyedRef.current) {
        try {
          playerRef.current = new window.YT.Player(containerRef.current, {
            height: isVideoMode ? "315" : "0",
            width: isVideoMode ? "560" : "0",
            videoId: videoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              enablejsapi: 1,
            },
            events: {
              onReady: onReady,
              onStateChange: (event: any) => onStateChange?.(event.data),
              onError: onError,
            },
          })
        } catch (error) {
          console.error("[v0] Error initializing YouTube player:", error)
        }
      }
    }

    if (window.YT && window.YT.Player) {
      initializePlayer()
    } else {
      window.onYouTubeIframeAPIReady = initializePlayer
    }

    return () => {
      if (playerRef.current && !isDestroyedRef.current) {
        try {
          isDestroyedRef.current = true

          // Check if player has destroy method and container exists
          if (typeof playerRef.current.destroy === "function") {
            // Additional check: ensure the iframe still exists
            const iframe = containerRef.current?.querySelector("iframe")
            if (iframe && iframe.parentNode) {
              playerRef.current.destroy()
              console.log("[v0] YouTube player destroyed successfully")
            } else {
              console.log("[v0] Container or iframe already removed, skipping destroy")
            }
          }
        } catch (error) {
          if (error.message && error.message.includes("removeChild")) {
            console.log("[v0] DOM element already removed, cleanup complete")
          } else {
            console.warn("[v0] Error during player cleanup:", error)
          }
        } finally {
          playerRef.current = null
        }
      }
    }
  }, []) // Remove dependencies to prevent recreation

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.loadVideoById === "function" && !isDestroyedRef.current) {
      console.log("[v0] Loading video:", videoId)
      try {
        playerRef.current.loadVideoById(videoId)
      } catch (error) {
        console.error("[v0] Error loading video:", error)
      }
    }
  }, [videoId])

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setSize === "function" && !isDestroyedRef.current) {
      playerRef.current.setSize(isVideoMode ? 560 : 0, isVideoMode ? 315 : 0)
    }
  }, [isVideoMode])

  useEffect(() => {
    if (!playerRef.current || isDestroyedRef.current) return

    try {
      if (state.isPlaying) {
        if (typeof playerRef.current.playVideo === "function") {
          playerRef.current.playVideo()
        }
      } else {
        if (typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo()
        }
      }
    } catch (error) {
      console.error("[v0] Error controlling video playback:", error)
    }
  }, [state.isPlaying])

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.seekTo === "function" && !isDestroyedRef.current) {
      try {
        playerRef.current.seekTo(state.currentTime, true)
      } catch (error) {
        console.error("[v0] Error seeking video:", error)
      }
    }
  }, [state.currentTime])

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === "function" && !isDestroyedRef.current) {
      try {
        playerRef.current.setVolume(state.volume * 100)
      } catch (error) {
        console.error("[v0] Error setting video volume:", error)
      }
    }
  }, [state.volume])

  return (
    <div
      ref={containerRef}
      style={{
        display: isVideoMode ? "block" : "none",
        maxWidth: "100%",
        aspectRatio: isVideoMode ? "16/9" : "auto",
        pointerEvents: "none",
      }}
      className={isVideoMode ? "rounded-lg overflow-hidden shadow-lg" : ""}
    />
  )
}

// Player control methods
export const useYouTubePlayer = (playerRef: any) => {
  const play = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === "function") {
      playerRef.current.playVideo()
    }
  }

  const pause = () => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
      playerRef.current.pauseVideo()
    }
  }

  const stop = () => {
    if (playerRef.current && typeof playerRef.current.stopVideo === "function") {
      playerRef.current.stopVideo()
    }
  }

  const seekTo = (seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(seconds)
    }
  }

  const getCurrentTime = () => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
      return playerRef.current.getCurrentTime()
    }
    return 0
  }

  const getDuration = () => {
    if (playerRef.current && typeof playerRef.current.getDuration === "function") {
      return playerRef.current.getDuration()
    }
    return 0
  }

  const getPlayerState = () => {
    if (playerRef.current && typeof playerRef.current.getPlayerState === "function") {
      return playerRef.current.getPlayerState()
    }
    return -1
  }

  return {
    play,
    pause,
    stop,
    seekTo,
    getCurrentTime,
    getDuration,
    getPlayerState,
  }
}
