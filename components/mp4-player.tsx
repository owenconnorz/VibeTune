"use client"

import { useEffect, useRef, useState } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { Button } from "@/components/ui/button"
import { ExternalLink, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"

interface MP4PlayerProps {
  videoUrl: string
  onReady?: () => void
  onError?: (error: any) => void
  showVideo?: boolean
}

export function MP4Player({ videoUrl, onReady, onError, showVideo = false }: MP4PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { state, setCurrentTime, setDuration, togglePlayPause, setVolume } = useAudioPlayer()
  const isVideoMode = showVideo || state.isVideoMode

  const isDirectVideoFile =
    videoUrl.endsWith(".mp4") ||
    videoUrl.endsWith(".webm") ||
    videoUrl.endsWith(".ogg") ||
    videoUrl.includes("googlevideo.com")
  const isPageUrl = videoUrl.includes("xnxx.com") || videoUrl.includes("eporner.com")

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isDirectVideoFile) return

    const handleLoadStart = () => {
      console.log("[v0] MP4 player loading started")
      setIsLoading(true)
      setHasError(false)
    }

    const handleLoadedMetadata = () => {
      console.log("[v0] MP4 player metadata loaded, duration:", video.duration)
      setDuration?.(video.duration)
      setIsLoading(false)
      onReady?.()
    }

    const handleCanPlay = () => {
      console.log("[v0] MP4 player can play")
      setIsLoading(false)
    }

    const handleError = (event: any) => {
      console.error("[v0] MP4 player error:", event)
      setIsLoading(false)
      setHasError(true)
      onError?.(event)
    }

    const handleTimeUpdate = () => {
      if (video.currentTime && video.duration) {
        setCurrentTime?.(video.currentTime)
      }
    }

    const handlePlay = () => {
      console.log("[v0] MP4 player started playing")
    }

    const handlePause = () => {
      console.log("[v0] MP4 player paused")
    }

    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("error", handleError)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("error", handleError)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [videoUrl, isDirectVideoFile])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isDirectVideoFile) return

    try {
      if (state.isPlaying) {
        video.play()
      } else {
        video.pause()
      }
    } catch (error) {
      console.error("[v0] Error controlling MP4 playback:", error)
    }
  }, [state.isPlaying, isDirectVideoFile])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isDirectVideoFile || Math.abs(video.currentTime - state.currentTime) < 1) return

    try {
      video.currentTime = state.currentTime
    } catch (error) {
      console.error("[v0] Error seeking MP4 video:", error)
    }
  }, [state.currentTime, isDirectVideoFile])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isDirectVideoFile) return

    try {
      video.volume = state.volume
      video.muted = isMuted
    } catch (error) {
      console.error("[v0] Error setting MP4 volume:", error)
    }
  }, [state.volume, isMuted, isDirectVideoFile])

  const handlePlayPause = () => {
    togglePlayPause?.()
  }

  const handleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      container.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  const openInNewTab = () => {
    window.open(videoUrl, "_blank", "noopener,noreferrer")
  }

  if (isPageUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">External Video</h3>
          <p className="text-zinc-400 text-sm mb-4">This video needs to be opened in a new tab to play properly.</p>
        </div>
        <Button onClick={openInNewTab} className="bg-orange-500 hover:bg-orange-600 text-white">
          <ExternalLink className="w-4 h-4 mr-2" />
          Watch Video
        </Button>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Playback Error</h3>
          <p className="text-zinc-400 text-sm mb-4">Unable to play this video. Try opening it in a new tab.</p>
        </div>
        <Button onClick={openInNewTab} className="bg-orange-500 hover:bg-orange-600 text-white">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Video
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={isDirectVideoFile ? videoUrl : undefined}
        style={{
          display: isVideoMode ? "block" : "none",
          width: "100%",
          maxWidth: "560px",
          aspectRatio: "16/9",
        }}
        className={isVideoMode ? "rounded-lg overflow-hidden shadow-lg bg-black" : ""}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
      />

      {isVideoMode && showControls && !isLoading && !hasError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 rounded-b-lg">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={handlePlayPause} className="text-white hover:bg-white/20">
                {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={handleFullscreen} className="text-white hover:bg-white/20">
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
