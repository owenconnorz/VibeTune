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
  const [bufferProgress, setBufferProgress] = useState(0)
  const [isBuffering, setIsBuffering] = useState(false)

  const { state, setCurrentTime, setDuration } = useAudioPlayer()
  const isVideoMode = showVideo || state.isVideoMode

  const isEpornerPageUrl = videoUrl.includes("eporner.com/video-") && !videoUrl.endsWith(".mp4")
  const isPageUrl = isEpornerPageUrl

  const isDirectVideoFile =
    videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.endsWith(".ogg") || videoUrl.endsWith(".mov")

  const updateTimeProgress = () => {
    if (!videoRef.current || isDestroyedRef.current || isPageUrl) return

    try {
      const video = videoRef.current
      const currentTime = video.currentTime || 0
      const duration = video.duration || 0

      if (currentTime > 0 && duration > 0) {
        setCurrentTime?.(currentTime)
        setDuration?.(duration)
      }

      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0
        setBufferProgress(bufferPercent)
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
    if (isPageUrl) {
      console.log("[v0] Using iframe for adult video:", videoUrl)
      const iframeTimeout = setTimeout(() => {
        if (!iframeLoaded) {
          console.log("[v0] Iframe failed to load within timeout, showing fallback")
          setIframeError(true)
        }
      }, 5000)

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
      setIsBuffering(false)
    }

    const handlePause = () => {
      stopTimeUpdates()
    }

    const handleWaiting = () => {
      console.log("[v0] Video buffering...")
      setIsBuffering(true)
    }

    const handleCanPlay = () => {
      console.log("[v0] Video can play")
      setIsBuffering(false)
    }

    const handleProgress = () => {
      updateTimeProgress()
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("error", handleError)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("progress", handleProgress)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("progress", handleProgress)
      stopTimeUpdates()
      isDestroyedRef.current = true
    }
  }, [videoUrl, isPageUrl, iframeLoaded])

  useEffect(() => {
    if (isPageUrl) return

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
  }, [state.isPlaying, isPageUrl])

  useEffect(() => {
    if (isPageUrl) return

    const video = videoRef.current
    if (!video) return

    try {
      video.currentTime = state.currentTime
    } catch (error) {
      console.error("[v0] Error seeking HTML5 video:", error)
    }
  }, [state.currentTime, isPageUrl])

  useEffect(() => {
    if (isPageUrl) return

    const video = videoRef.current
    if (!video) return

    try {
      video.volume = state.volume
    } catch (error) {
      console.error("[v0] Error setting HTML5 video volume:", error)
    }
  }, [state.volume, isPageUrl])

  const openInNewTab = () => {
    window.open(videoUrl, "_blank", "noopener,noreferrer")
  }

  if (isPageUrl) {
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
    <div className="relative">
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
        preload="auto"
        crossOrigin="anonymous"
        controls={isVideoMode}
        playsInline
        webkit-playsinline="true"
      />
      {isBuffering && isVideoMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-white text-sm">Buffering... {Math.round(bufferProgress)}%</div>
        </div>
      )}
    </div>
  )
}
