"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"

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

export function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<VideoTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  const playVideo = async (video: VideoTrack) => {
    console.log("[v0] Video player: Playing video:", video.title)
    setCurrentVideo(video)
    setIsLoading(true)

    if (videoRef.current) {
      videoRef.current.src = video.videoUrl
      try {
        await videoRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("[v0] Video player: Error playing video:", error)
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
        console.error("[v0] Video player: Error resuming video:", error)
      }
    }
  }

  const stopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    }
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
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

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
      <video ref={videoRef} className="hidden" controls={false} preload="metadata" />
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
