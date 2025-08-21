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
  const { state } = useAudioPlayer()

  const isVideoMode = showVideo || state.isVideoMode

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = initializePlayer
    } else {
      initializePlayer()
    }

    function initializePlayer() {
      if (containerRef.current && !playerRef.current) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: isVideoMode ? "315" : "0",
          width: isVideoMode ? "560" : "0",
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: isVideoMode ? 1 : 0,
            disablekb: isVideoMode ? 0 : 1,
            fs: isVideoMode ? 1 : 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: onReady,
            onStateChange: (event: any) => onStateChange?.(event.data),
            onError: onError,
          },
        })
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [videoId, onReady, onStateChange, onError, isVideoMode])

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setSize(isVideoMode ? 560 : 0, isVideoMode ? 315 : 0)
    }
  }, [isVideoMode])

  // Expose player methods
  useEffect(() => {
    if (playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId)
    }
  }, [videoId])

  return (
    <div
      ref={containerRef}
      style={{
        display: isVideoMode ? "block" : "none",
        maxWidth: "100%",
        aspectRatio: isVideoMode ? "16/9" : "auto",
      }}
      className={isVideoMode ? "rounded-lg overflow-hidden shadow-lg" : ""}
    />
  )
}

// Player control methods
export const useYouTubePlayer = (playerRef: any) => {
  const play = () => playerRef.current?.playVideo()
  const pause = () => playerRef.current?.pauseVideo()
  const stop = () => playerRef.current?.stopVideo()
  const seekTo = (seconds: number) => playerRef.current?.seekTo(seconds)
  const getCurrentTime = () => playerRef.current?.getCurrentTime() || 0
  const getDuration = () => playerRef.current?.getDuration() || 0
  const getPlayerState = () => playerRef.current?.getPlayerState()

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
