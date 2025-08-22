"use client"

import { useEffect, useRef, useState } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface HTML5VideoPlayerProps {
  videoUrl: string
  onReady?: () => void
  onError?: (error: any) => void
  showVideo?: boolean
}

export function HTML5VideoPlayer({ videoUrl, onReady, onError, showVideo = false }: HTML5VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isDestroyedRef = useRef(false)
  const [iframeError, setIframeError] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const { state, setCurrentTime, setDuration } = useAudioPlayer()
  const isVideoMode = showVideo || state.isVideoMode

  const isEpornerPageUrl = videoUrl.includes("eporner.com/video-") && !videoUrl.endsWith(".mp4")
  const isDirectVideoFile = videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.endsWith(".ogg")

  const updateTimeProgress = () => {
    if (!videoRef.current || isDestroyedRef.current || isEpornerPageUrl) return

    try {
      const currentTime = videoRef.current.currentTime || 0
      const duration = videoRef.current.duration || 0

      if (currentTime > 0 && duration > 0) {
        setCurrentTime?.(currentTime)
        setDuration?.(duration)
      }
    } catch (error) {
      console.error("[v0] Error updating HTML5 video time progress:", error)
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

  useEffect(() => {
    if (isEpornerPageUrl) {
      console.log("[v0] Using iframe for eporner video:", videoUrl)
      const iframeTimeout = setTimeout(() => {
        if (!iframeLoaded) {
          console.log("[v0] Iframe failed to load within timeout, showing fallback")
          setIframeError(true)
        }
      }, 10000) // 10 second timeout

      onReady?.()

      return () => {
        clearTimeout(iframeTimeout)
      }
    }

    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      console.log("[v0] HTML5 video metadata loaded")
      setDuration?.(video.duration)
      onReady?.()
    }

    const handleError = (error: any) => {
      console.error("[v0] HTML5 video error:", error)
      stopTimeUpdates()
      onError?.(error)
    }

    const handlePlay = () => {
      startTimeUpdates()
    }

    const handlePause = () => {
      stopTimeUpdates()
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("error", handleError)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      stopTimeUpdates()
      isDestroyedRef.current = true
    }
  }, [videoUrl, isEpornerPageUrl, iframeLoaded])

  useEffect(() => {
    if (isEpornerPageUrl) return

    const video = videoRef.current
    if (!video) return

    try {
      if (state.isPlaying) {
        video.play()
      } else {
        video.pause()
      }
    } catch (error) {
      console.error("[v0] Error controlling HTML5 video playback:", error)
    }
  }, [state.isPlaying, isEpornerPageUrl])

  useEffect(() => {
    if (isEpornerPageUrl) return

    const video = videoRef.current
    if (!video) return

    try {
      video.currentTime = state.currentTime
    } catch (error) {
      console.error("[v0] Error seeking HTML5 video:", error)
    }
  }, [state.currentTime, isEpornerPageUrl])

  useEffect(() => {
    if (isEpornerPageUrl) return

    const video = videoRef.current
    if (!video) return

    try {
      video.volume = state.volume
    } catch (error) {
      console.error("[v0] Error setting HTML5 video volume:", error)
    }
  }, [state.volume, isEpornerPageUrl])

  const openInNewTab = () => {
    window.open(videoUrl, "_blank", "noopener,noreferrer")
  }

  if (isEpornerPageUrl) {
    if (iframeError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Video Unavailable</h3>
            <p className="text-zinc-400 text-sm mb-4">
              This video cannot be embedded. Click below to watch it directly.
            </p>
          </div>
          <Button onClick={openInNewTab} className="bg-orange-500 hover:bg-orange-600 text-white">
            <ExternalLink className="w-4 h-4 mr-2" />
            Watch Video
          </Button>
        </div>
      )
    }

    return (
      <div className="relative">
        <iframe
          ref={iframeRef}
          src={videoUrl}
          style={{
            display: isVideoMode ? "block" : "none",
            width: "100%",
            maxWidth: "560px",
            aspectRatio: "16/9",
            border: "none",
          }}
          className={isVideoMode ? "rounded-lg overflow-hidden shadow-lg" : ""}
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          onLoad={() => {
            console.log("[v0] Iframe loaded successfully")
            setIframeLoaded(true)
          }}
          onError={() => {
            console.log("[v0] Iframe failed to load")
            setIframeError(true)
          }}
        />
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-lg">
            <div className="text-white">Loading video...</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      style={{
        display: isVideoMode ? "block" : "none",
        width: "100%",
        maxWidth: "560px",
        aspectRatio: "16/9",
      }}
      className={isVideoMode ? "rounded-lg overflow-hidden shadow-lg" : ""}
      preload="metadata"
      crossOrigin="anonymous"
    />
  )
}
