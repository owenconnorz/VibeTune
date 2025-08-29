"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"
import { useRenderOptimization } from "./render-optimization-context"

interface VideoTrack {
  id: string
  title: string
  artist?: string
  thumbnail?: string
  duration?: number
  videoUrl: string
  source?: string
}

interface VideoPlayerContextType {
  currentVideo: VideoTrack | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  playVideo: (video: VideoTrack) => void
  pauseVideo: () => void
  resumeVideo: () => void
  stopVideo: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleFullscreen: () => void
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined)

interface MuxPlayerElement extends HTMLElement {
  play(): Promise<void>
  pause(): void
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playbackRate: number
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
  requestFullscreen(): Promise<void>
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "mux-player": React.DetailedHTMLProps<React.HTMLAttributes<MuxPlayerElement>, MuxPlayerElement> & {
        "playback-id"?: string
        "stream-type"?: string
        src?: string
        poster?: string
        controls?: boolean
        autoplay?: boolean
        muted?: boolean
        loop?: boolean
        preload?: string
        crossorigin?: string
        playsinline?: boolean
        "webkit-playsinline"?: boolean
        "prefer-mse"?: boolean
        "disable-tracking"?: boolean
        debug?: boolean
        ref?: React.RefObject<MuxPlayerElement>
      }
    }
  }
}

export function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<VideoTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<MuxPlayerElement>(null)
  const { optimizeForVideo, setOptimizeForVideo, renderQuality, refreshRate } = useRenderOptimization()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/@mux/mux-player@2/dist/index.js"
    script.type = "module"
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const playVideo = async (video: VideoTrack) => {
    console.log("[v0] Mux Player: Playing video:", video.title)
    setCurrentVideo(video)
    setIsLoading(true)

    setIsFullscreen(true)
    setOptimizeForVideo(true)

    if (videoRef.current) {
      const muxPlayer = videoRef.current

      muxPlayer.setAttribute("src", video.videoUrl)

      muxPlayer.classList.remove("hidden")
      muxPlayer.style.position = "fixed"
      muxPlayer.style.top = "0"
      muxPlayer.style.left = "0"
      muxPlayer.style.width = "100vw"
      muxPlayer.style.height = "100vh"
      muxPlayer.style.zIndex = "9999"
      muxPlayer.style.backgroundColor = "black"

      switch (renderQuality) {
        case "ultra":
          muxPlayer.style.filter = "contrast(1.1) saturate(1.1) brightness(1.05)"
          muxPlayer.setAttribute("prefer-mse", "true")
          break
        case "high":
          muxPlayer.style.filter = "contrast(1.05) saturate(1.05)"
          muxPlayer.setAttribute("prefer-mse", "true")
          break
        case "medium":
          muxPlayer.style.filter = "none"
          break
        case "low":
          muxPlayer.style.filter = "contrast(0.95) saturate(0.95)"
          break
      }

      if (refreshRate > 60) {
        muxPlayer.style.willChange = "transform, opacity"
        muxPlayer.style.transform = "translateZ(0)"
        muxPlayer.setAttribute("debug", "false")
      }

      muxPlayer.setAttribute("controls", "true")

      try {
        await muxPlayer.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("[v0] Mux Player: Error playing video:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resumeVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("[v0] Mux Player: Error resuming video:", error)
      }
    }
  }

  const stopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)

      videoRef.current.classList.add("hidden")
      videoRef.current.style.position = ""
      videoRef.current.style.top = ""
      videoRef.current.style.left = ""
      videoRef.current.style.width = ""
      videoRef.current.style.height = ""
      videoRef.current.style.zIndex = ""
      videoRef.current.style.backgroundColor = ""
      videoRef.current.setAttribute("controls", "false")
    }
    setOptimizeForVideo(false)
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleSetVolume = (newVolume: number) => {
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const muxPlayer = videoRef.current
    if (!muxPlayer) return

    muxPlayer.setAttribute("playsinline", "true")
    muxPlayer.setAttribute("webkit-playsinline", "true")
    muxPlayer.setAttribute("crossorigin", "anonymous")
    muxPlayer.setAttribute("disable-tracking", "true")
    muxPlayer.setAttribute("prefer-mse", "true")

    muxPlayer.classList.add("video-optimized")
    if (optimizeForVideo) {
      muxPlayer.classList.add("cloudstream-optimized")
    }

    const handleTimeUpdate = () => setCurrentTime(muxPlayer.currentTime)
    const handleDurationChange = () => setDuration(muxPlayer.duration)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      setOptimizeForVideo(false)
    }

    muxPlayer.addEventListener("timeupdate", handleTimeUpdate)
    muxPlayer.addEventListener("durationchange", handleDurationChange)
    muxPlayer.addEventListener("loadstart", handleLoadStart)
    muxPlayer.addEventListener("canplay", handleCanPlay)
    muxPlayer.addEventListener("ended", handleEnded)

    return () => {
      muxPlayer.removeEventListener("timeupdate", handleTimeUpdate)
      muxPlayer.removeEventListener("durationchange", handleDurationChange)
      muxPlayer.removeEventListener("loadstart", handleLoadStart)
      muxPlayer.removeEventListener("canplay", handleCanPlay)
      muxPlayer.removeEventListener("ended", handleEnded)
    }
  }, [optimizeForVideo, setOptimizeForVideo])

  return (
    <VideoPlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        isFullscreen,
        playVideo,
        pauseVideo,
        resumeVideo,
        stopVideo,
        seekTo,
        setVolume: handleSetVolume,
        toggleMute,
        toggleFullscreen,
      }}
    >
      {children}
      <mux-player
        ref={videoRef}
        className="hidden video-optimized"
        controls={false}
        preload="metadata"
        playsinline
        webkit-playsinline="true"
        crossorigin="anonymous"
        disable-tracking="true"
        prefer-mse="true"
      />
    </VideoPlayerContext.Provider>
  )
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext)
  if (context === undefined) {
    throw new Error("useVideoPlayer must be used within a VideoPlayerProvider")
  }
  return context
}
