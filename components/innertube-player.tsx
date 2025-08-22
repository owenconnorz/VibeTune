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
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getStreamUrl = useCallback(async (videoId: string) => {
    try {
      const response = await fetch("/api/innertube/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })

      if (!response.ok) throw new Error("Failed to get stream URL")

      const data = await response.json()
      return data.streamUrl
    } catch (error) {
      console.error("[v0] Failed to get stream URL:", error)
      return null
    }
  }, [])

  useEffect(() => {
    if (!videoId) return

    const loadStream = async () => {
      const url = await getStreamUrl(videoId)
      setStreamUrl(url)
    }

    loadStream()
  }, [videoId, getStreamUrl])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !streamUrl) return

    const handleLoadedMetadata = () => {
      console.log("[v0] Innertube player loaded metadata")
      setDuration(player.duration)
      setIsReady(true)
      onReady?.()
    }

    const handleTimeUpdate = () => {
      setCurrentTime(player.currentTime)
    }

    const handleError = (e: Event) => {
      console.error("[v0] Innertube player error:", e)
      onError?.(e)
    }

    const handleEnded = () => {
      console.log("[v0] Track ended, checking for next track")
      // Check if there's a next track in the queue
      if (state.currentIndex < state.queue.length - 1) {
        console.log("[v0] Playing next track automatically")
        nextTrack()
      } else {
        console.log("[v0] No more tracks in queue, playback ended")
      }
    }

    player.addEventListener("loadedmetadata", handleLoadedMetadata)
    player.addEventListener("timeupdate", handleTimeUpdate)
    player.addEventListener("error", handleError)
    player.addEventListener("ended", handleEnded)

    return () => {
      player.removeEventListener("loadedmetadata", handleLoadedMetadata)
      player.removeEventListener("timeupdate", handleTimeUpdate)
      player.removeEventListener("error", handleError)
      player.removeEventListener("ended", handleEnded)
    }
  }, [streamUrl, setCurrentTime, setDuration, onReady, onError, nextTrack, state.currentIndex, state.queue.length])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return

    if (state.isPlaying) {
      player.play().catch(console.error)
    } else {
      player.pause()
    }
  }, [state.isPlaying, isReady])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return

    if (Math.abs(player.currentTime - state.currentTime) > 1) {
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
      preload="metadata"
      crossOrigin="anonymous"
    />
  )
}
