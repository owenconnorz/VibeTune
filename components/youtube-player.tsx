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
  const isInitializingRef = useRef(false) // Add initialization lock
  const isReadyRef = useRef(false) // Add ready state tracking
  const pendingVideoIdRef = useRef<string | null>(null)
  const prevIsPlayingRef = useRef<boolean | null>(null)
  const prevCurrentTimeRef = useRef<number | null>(null)
  const prevVolumeRef = useRef<number | null>(null)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { state, setCurrentTime, setDuration } = useAudioPlayer()

  const isVideoMode = showVideo || state.isVideoMode

  const updateTimeProgress = () => {
    if (!playerRef.current || isDestroyedRef.current) return

    if (!setCurrentTime || !setDuration) {
      console.error("[v0] Time update functions not available, skipping time update")
      return
    }

    try {
      const currentTime = playerRef.current.getCurrentTime?.() || 0
      const duration = playerRef.current.getDuration?.() || 0

      if (currentTime > 0 && duration > 0) {
        setCurrentTime(currentTime)
        setDuration(duration)
        console.log("[v0] Time update:", { currentTime: currentTime.toFixed(2), duration: duration.toFixed(2) })
      }
    } catch (error) {
      console.error("[v0] Error updating time progress:", error)
    }
  }

  const startTimeUpdates = () => {
    if (timeUpdateIntervalRef.current) return
    console.log("[v0] Starting time progress updates")
    timeUpdateIntervalRef.current = setInterval(updateTimeProgress, 1000)
  }

  const stopTimeUpdates = () => {
    if (timeUpdateIntervalRef.current) {
      console.log("[v0] Stopping time progress updates")
      clearInterval(timeUpdateIntervalRef.current)
      timeUpdateIntervalRef.current = null
    }
  }

  useEffect(() => {
    console.log("[v0] YouTubePlayer component mounted with videoId:", videoId)
    console.log("[v0] isVideoMode:", isVideoMode, "showVideo:", showVideo, "state.isVideoMode:", state.isVideoMode)
    console.log("[v0] Audio player context on mount:", {
      hasState: !!state,
      hasSetCurrentTime: !!setCurrentTime,
      hasSetDuration: !!setDuration,
    })
  }, [])

  useEffect(() => {
    if (!window.YT) {
      console.log("[v0] Loading YouTube iframe API")
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    } else {
      console.log("[v0] YouTube API already loaded")
    }
  }, [])

  useEffect(() => {
    function initializePlayer() {
      if (isInitializingRef.current || isDestroyedRef.current) {
        console.log("[v0] Skipping initialization - already in progress or destroyed")
        return
      }

      console.log("[v0] Attempting to initialize YouTube player")
      console.log("[v0] Container exists:", !!containerRef.current)
      console.log("[v0] Player already exists:", !!playerRef.current)
      console.log("[v0] Is destroyed:", isDestroyedRef.current)

      if (containerRef.current && !playerRef.current && !isDestroyedRef.current) {
        try {
          isInitializingRef.current = true // Set initialization lock
          isReadyRef.current = false // Reset ready state when creating new player
          console.log("[v0] Creating YouTube player with videoId:", videoId)

          if (containerRef.current) {
            containerRef.current.innerHTML = ""
          }

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
              onReady: (event: any) => {
                console.log("[v0] YouTube player ready")
                isInitializingRef.current = false // Clear initialization lock
                isReadyRef.current = true // Set ready state

                // Load pending video if there is one
                if (pendingVideoIdRef.current) {
                  console.log("[v0] Loading pending video:", pendingVideoIdRef.current)
                  try {
                    playerRef.current.loadVideoById(pendingVideoIdRef.current)
                    pendingVideoIdRef.current = null
                  } catch (error) {
                    console.error("[v0] Error loading pending video:", error)
                  }
                }

                setTimeout(() => {
                  console.log("[v0] Player methods available:", {
                    loadVideoById: typeof playerRef.current?.loadVideoById === "function",
                    playVideo: typeof playerRef.current?.playVideo === "function",
                    pauseVideo: typeof playerRef.current?.pauseVideo === "function",
                  })
                }, 100)
                onReady?.()
              },
              onStateChange: (event: any) => {
                console.log("[v0] YouTube player state changed:", event.data)

                if (event.data === 1) {
                  // Playing
                  startTimeUpdates()
                } else {
                  // Paused, ended, etc.
                  stopTimeUpdates()
                }

                onStateChange?.(event.data)
              },
              onError: (event: any) => {
                console.error("[v0] YouTube player error:", event.data)
                isInitializingRef.current = false // Clear initialization lock on error
                isReadyRef.current = false // Reset ready state on error
                const errorCode = event.data
                let errorMessage = "Unknown error"

                switch (errorCode) {
                  case 2:
                    errorMessage = "Invalid video ID"
                    console.error("[v0] Invalid video ID:", videoId)
                    break
                  case 5:
                    errorMessage = "HTML5 player error"
                    console.error("[v0] HTML5 player error for video:", videoId)
                    break
                  case 100:
                    errorMessage = "Video not found or private"
                    console.error("[v0] Video not found or private:", videoId)
                    break
                  case 101:
                  case 150:
                    errorMessage = "Video not allowed to be played in embedded players"
                    console.error("[v0] Video embedding not allowed:", videoId)
                    break
                  default:
                    console.error("[v0] Unknown YouTube error code:", errorCode)
                }

                console.error("[v0] YouTube error details:", {
                  videoId,
                  errorCode,
                  errorMessage,
                  timestamp: new Date().toISOString(),
                })

                stopTimeUpdates()
                onError?.(event)
              },
            },
          })
          console.log("[v0] YouTube player created successfully")
        } catch (error) {
          console.error("[v0] Error initializing YouTube player:", error)
          isInitializingRef.current = false // Clear initialization lock on error
          isReadyRef.current = false // Reset ready state on error
        }
      }
    }

    if (window.YT && window.YT.Player) {
      console.log("[v0] YouTube API ready, initializing player")
      initializePlayer()
    } else {
      console.log("[v0] YouTube API not ready, setting callback")
      window.onYouTubeIframeAPIReady = initializePlayer
    }

    return () => {
      stopTimeUpdates()

      if (playerRef.current && !isDestroyedRef.current) {
        try {
          isDestroyedRef.current = true
          isInitializingRef.current = false
          isReadyRef.current = false // Reset ready state on cleanup

          const container = containerRef.current
          const iframe = container?.querySelector("iframe")

          if (container && iframe && document.contains(container) && document.contains(iframe)) {
            console.log("[v0] Destroying YouTube player with valid DOM")
            playerRef.current.destroy()
            console.log("[v0] YouTube player destroyed successfully")
          } else {
            console.log("[v0] Container or iframe not in DOM, skipping destroy")
            if (container && document.contains(container)) {
              container.innerHTML = ""
            }
          }
        } catch (error) {
          if (error.message && (error.message.includes("removeChild") || error.message.includes("Node"))) {
            console.log("[v0] DOM element already removed, cleanup complete")
          } else {
            console.warn("[v0] Error during player cleanup:", error)
          }
        } finally {
          playerRef.current = null
          isInitializingRef.current = false
          isReadyRef.current = false
        }
      }
    }
  }, []) // Remove dependencies to prevent recreation

  useEffect(() => {
    if (!videoId || videoId.trim() === "") {
      console.error("[v0] Cannot load video - invalid video ID:", videoId)
      return
    }

    if (!playerRef.current || isDestroyedRef.current || isInitializingRef.current) {
      console.log("[v0] Player not ready, storing video ID for later:", videoId)
      pendingVideoIdRef.current = videoId
      return
    }

    if (!isReadyRef.current) {
      console.log("[v0] Player not ready yet, storing video ID for later:", videoId)
      pendingVideoIdRef.current = videoId
      return
    }

    console.log("[v0] Loading video:", videoId)
    try {
      playerRef.current.loadVideoById(videoId)
      console.log("[v0] Video loaded successfully")
      pendingVideoIdRef.current = null
    } catch (error) {
      console.error("[v0] Error loading video:", error)
    }
  }, [videoId])

  useEffect(() => {
    if (!playerRef.current || isDestroyedRef.current) return

    // Only update if the playing state actually changed
    if (prevIsPlayingRef.current === state.isPlaying) return
    prevIsPlayingRef.current = state.isPlaying

    console.log("[v0] Playback state changed to:", state.isPlaying)

    try {
      if (state.isPlaying) {
        if (typeof playerRef.current.playVideo === "function") {
          console.log("[v0] Calling playVideo()")
          playerRef.current.playVideo()
          startTimeUpdates()
        }
      } else {
        if (typeof playerRef.current.pauseVideo === "function") {
          console.log("[v0] Calling pauseVideo()")
          playerRef.current.pauseVideo()
          stopTimeUpdates()
        }
      }
    } catch (error) {
      console.error("[v0] Error controlling video playback:", error)
    }
  }, [state.isPlaying])

  useEffect(() => {
    if (!playerRef.current || isDestroyedRef.current) return

    // Only seek if the time difference is significant (more than 1 second)
    const timeDiff = Math.abs((prevCurrentTimeRef.current || 0) - state.currentTime)
    if (timeDiff < 1) return
    prevCurrentTimeRef.current = state.currentTime

    try {
      if (typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(state.currentTime, true)
      }
    } catch (error) {
      console.error("[v0] Error seeking video:", error)
    }
  }, [state.currentTime])

  useEffect(() => {
    if (!playerRef.current || isDestroyedRef.current) return

    // Only update if volume actually changed
    if (prevVolumeRef.current === state.volume) return
    prevVolumeRef.current = state.volume

    try {
      if (typeof playerRef.current.setVolume === "function") {
        playerRef.current.setVolume(state.volume * 100)
      }
    } catch (error) {
      console.error("[v0] Error setting video volume:", error)
    }
  }, [state.volume])

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setSize === "function" && !isDestroyedRef.current) {
      playerRef.current.setSize(isVideoMode ? 560 : 0, isVideoMode ? 315 : 0)
    }
  }, [isVideoMode])

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
