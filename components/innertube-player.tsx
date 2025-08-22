"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"

interface InnertubePlayerProps {
  videoId: string
  showVideo?: boolean
  onReady?: () => void
  onError?: (error: any) => void
}

export function InnertubePlayer({ videoId, showVideo = false, onReady, onError }: InnertubePlayerProps) {
  const { state, setCurrentTime, setDuration, nextTrack } = useAudioPlayer()
  const playerRef = useRef<HTMLVideoElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getStreamUrl = useCallback(async (videoId: string) => {
    try {
      console.log("[v0] Fetching stream URL for:", videoId)
      const response = await fetch("/api/innertube/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })

      if (!response.ok) throw new Error("Failed to get stream URL")

      const data = await response.json()
      console.log("[v0] Stream URL received:", data.streamUrl ? "✓" : "✗")
      return data.streamUrl
    } catch (error) {
      console.error("[v0] Failed to get stream URL:", error)
      return null
    }
  }, [])

  useEffect(() => {
    if (!videoId) return

    const loadStream = async () => {
      console.log("[v0] Loading stream for videoId:", videoId)
      setStreamUrl(null)
      setIsReady(false)
      const url = await getStreamUrl(videoId)
      setStreamUrl(url)
    }

    loadStream()
  }, [videoId, getStreamUrl])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !streamUrl) return

    const handleLoadedMetadata = () => {
      console.log("[v0] Innertube player loaded metadata, duration:", player.duration)
      setDuration(player.duration)
      setIsReady(true)
      setIsBuffering(false)
      onReady?.()
    }

    const handleTimeUpdate = () => {
      setCurrentTime(player.currentTime)
    }

    const handleError = (e: Event) => {
      console.error("[v0] Innertube player error:", e)
      setIsBuffering(false)
      onError?.(e)
    }

    const handleWaiting = () => {
      console.log("[v0] Player waiting/buffering")
      setIsBuffering(true)
    }

    const handleCanPlay = () => {
      console.log("[v0] Player can play")
      setIsBuffering(false)
    }

    const handleStalled = () => {
      console.log("[v0] Player stalled")
      setIsBuffering(true)
    }

    const handleEnded = () => {
      console.log("[v0] Track ended, checking for next track")
      if (state.currentIndex < state.queue.length - 1) {
        console.log("[v0] Playing next track automatically")
        nextTrack()
      } else {
        console.log("[v0] No more tracks in queue, playback ended")
      }
    }

    const handleLoadStart = () => {
      console.log("[v0] Stream loading started")
      setIsBuffering(true)
    }

    player.addEventListener("loadedmetadata", handleLoadedMetadata)
    player.addEventListener("timeupdate", handleTimeUpdate)
    player.addEventListener("error", handleError)
    player.addEventListener("ended", handleEnded)
    player.addEventListener("waiting", handleWaiting)
    player.addEventListener("canplay", handleCanPlay)
    player.addEventListener("stalled", handleStalled)
    player.addEventListener("loadstart", handleLoadStart)

    return () => {
      player.removeEventListener("loadedmetadata", handleLoadedMetadata)
      player.removeEventListener("timeupdate", handleTimeUpdate)
      player.removeEventListener("error", handleError)
      player.removeEventListener("ended", handleEnded)
      player.removeEventListener("waiting", handleWaiting)
      player.removeEventListener("canplay", handleCanPlay)
      player.removeEventListener("stalled", handleStalled)
      player.removeEventListener("loadstart", handleLoadStart)
    }
  }, [streamUrl, setCurrentTime, setDuration, onReady, onError, nextTrack, state.currentIndex, state.queue.length])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return

    if (state.isPlaying && !isBuffering) {
      console.log("[v0] Starting playback")
      player.play().catch((error) => {
        console.error("[v0] Play failed:", error)
      })
    } else {
      console.log("[v0] Pausing playback")
      player.pause()
    }
  }, [state.isPlaying, isReady, isBuffering])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return

    if (Math.abs(player.currentTime - state.currentTime) > 0.5) {
      console.log("[v0] Seeking to:", state.currentTime)
      player.currentTime = state.currentTime
    }
  }, [state.currentTime, isReady])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    player.volume = state.volume
  }, [state.volume])

  if (!streamUrl) {
    return <div className="w-full h-full flex items-center justify-center bg-black text-white">Loading stream...</div>
  }

  return (
    <video
      ref={playerRef}
      src={streamUrl}
      className={showVideo ? "w-full h-full object-cover" : "hidden"}
      playsInline
      preload="auto"
      crossOrigin="anonymous"
      style={
        {
          bufferSize: "1024000",
          preloadBufferSize: "512000",
        } as any
      }
    />
  )
}
