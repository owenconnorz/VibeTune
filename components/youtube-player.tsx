"use client"

import { useEffect, useRef } from "react"

interface YouTubePlayerProps {
  videoId: string
  onReady?: () => void
  onStateChange?: (state: number) => void
  onError?: (error: any) => void
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function YouTubePlayer({ videoId, onReady, onStateChange, onError }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
  }, [videoId, onReady, onStateChange, onError])

  // Expose player methods
  useEffect(() => {
    if (playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId)
    }
  }, [videoId])

  return <div ref={containerRef} style={{ display: "none" }} />
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
