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

  const isVideoMode = false // Always false for YouTube - only audio playback

  const updateTimeProgress = () => {
    if (!playerRef.current || isDestroyedRef.current) return

    if (!setCurrentTime || !setDuration) {
      return
    }

    try {
      const currentTime = playerRef.current.getCurrentTime?.() || 0
      const duration = playerRef.current.getDuration?.() || 0

      if (currentTime > 0 && duration > 0) {
        setCurrentTime(currentTime)
        setDuration(duration)
      }
    } catch (error) {
      console.error("Error updating time progress:", error)
    }
  }

  const startTimeUpdates = () => {
    if (timeUpdateIntervalRef.current) return
    timeUpdateIntervalRef.current = setInterval(updateTimeProgress, 1000)
  }

  const stopTimeUpdates = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
      timeUpdateIntervalRef.current = null
    }
  }

  useEffect(() => {}, [])

  useEffect(() => {
    if (!window.YT) {
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
        return
      }

      if (containerRef.current && !playerRef.current && !isDestroyedRef.current) {
        try {
          isInitializingRef.current = true
          isReadyRef.current = false

          if (containerRef.current) {
            containerRef.current.innerHTML = ""
          }

          playerRef.current = new window.YT.Player(containerRef.current, {
            height: "0",
            width: "0",
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
                isInitializingRef.current = false
                isReadyRef.current = true

                if (pendingVideoIdRef.current) {
                  try {
                    playerRef.current.loadVideoById(pendingVideoIdRef.current)
                    pendingVideoIdRef.current = null
                  } catch (error) {
                    console.error("Error loading pending video:", error)
                  }
                }

                onReady?.()
              },
              onStateChange: (event: any) => {
                if (event.data === 1) {
                  startTimeUpdates()
                } else {
                  stopTimeUpdates()
                }

                onStateChange?.(event.data)
              },
              onError: (event: any) => {
                isInitializingRef.current = false
                isReadyRef.current = false
                const errorCode = event.data
                let errorMessage = "Unknown error"

                switch (errorCode) {
                  case 2:
                    errorMessage = "Invalid video ID"
                    break
                  case 5:
                    errorMessage = "HTML5 player error"
                    setTimeout(() => {
                      if (state?.currentTrack && typeof state.skipToNext === "function") {
                        state.skipToNext()
                      }
                    }, 1000)
                    break
                  case 100:
                    errorMessage = "Video not found or private"
                    setTimeout(() => {
                      if (state?.currentTrack && typeof state.skipToNext === "function") {
                        state.skipToNext()
                      }
                    }, 1000)
                    break
                  case 101:
                  case 150:
                    errorMessage = "Video not allowed to be played in embedded players"
                    setTimeout(() => {
                      if (state?.currentTrack && typeof state.skipToNext === "function") {
                        state.skipToNext()
                      }
                    }, 1000)
                    break
                }

                stopTimeUpdates()
                onError?.(event)
              },
            },
          })
        } catch (error) {
          console.error("Error initializing YouTube player:", error)
          isInitializingRef.current = false
          isReadyRef.current = false
        }
      }
    }

    if (window.YT && window.YT.Player) {
      initializePlayer()
    } else {
      window.onYouTubeIframeAPIReady = initializePlayer
    }

    return () => {
      stopTimeUpdates()

      if (playerRef.current && !isDestroyedRef.current) {
        try {
          isDestroyedRef.current = true
          isInitializingRef.current = false
          isReadyRef.current = false

          const container = containerRef.current
          const iframe = container?.querySelector("iframe")

          if (container && iframe && document.contains(container) && document.contains(iframe)) {
            playerRef.current.destroy()
          } else {
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
  }, [])

  useEffect(() => {
    if (!videoId || videoId.trim() === "") {
      console.error("Cannot load video - invalid video ID:", videoId)
      return
    }

    if (!playerRef.current || isDestroyedRef.current || isInitializingRef.current) {
      pendingVideoIdRef.current = videoId
      return
    }

    if (!isReadyRef.current) {
      pendingVideoIdRef.current = videoId
      return
    }

    try {
      playerRef.current.loadVideoById(videoId)
      pendingVideoIdRef.current = null
    } catch (error) {
      console.error("Error loading video:", error)
    }
  }, [videoId])

  useEffect(() => {
    if (!playerRef.current || isDestroyedRef.current) return

    if (prevIsPlayingRef.current === state.isPlaying) return
    prevIsPlayingRef.current = state.isPlaying

    try {
      if (state.isPlaying) {
        if (typeof playerRef.current.playVideo === "function") {
          playerRef.current.playVideo()
          startTimeUpdates()
        }
      } else {
        if (typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo()
          stopTimeUpdates()
        }
      }
    } catch (error) {
      console.error("Error controlling video playback:", error)
    }
  }, [state.isPlaying])

  useEffect(() => {
    if (!playerRef.current || isDestroyedRef.current) return

    const timeDiff = Math.abs((prevCurrentTimeRef.current || 0) - state.currentTime)
    if (timeDiff < 1) return
    prevCurrentTimeRef.current = state.currentTime

    try {
      if (typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(state.currentTime, true)
      }
    } catch (error) {
      console.error("Error seeking video:", error)
    }
  }, [state.currentTime])

  useEffect(() => {
    if (!playerRef.current || isDestroyedRef.current) return

    if (prevVolumeRef.current === state.volume) return
    prevVolumeRef.current = state.volume

    try {
      if (typeof playerRef.current.setVolume === "function") {
        playerRef.current.setVolume(state.volume * 100)
      }
    } catch (error) {
      console.error("Error setting video volume:", error)
    }
  }, [state.volume])

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setSize === "function" && !isDestroyedRef.current) {
      playerRef.current.setSize(0, 0)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        display: "none",
        maxWidth: "100%",
        aspectRatio: "auto",
        pointerEvents: "none",
      }}
      className=""
    />
  )
}

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
