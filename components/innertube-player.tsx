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
  const [retryCount, setRetryCount] = useState(0)
  const [autoRenderEnabled, setAutoRenderEnabled] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getStreamUrl = useCallback(async (videoId: string, attempt = 1) => {
    try {
      console.log(`[v0] Fetching stream URL for: ${videoId} (attempt ${attempt})`)
      const response = await fetch("/api/innertube/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to get stream URL: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Stream URL received:", data.streamUrl ? "✓" : "✗")
      console.log("[v0] Audio quality:", data.audioQuality)
      return data.streamUrl
    } catch (error) {
      console.error(`[v0] Failed to get stream URL (attempt ${attempt}):`, error)
      if (attempt < 3) {
        console.log(`[v0] Retrying stream request in ${attempt * 1000}ms...`)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
        return this.getStreamUrl(videoId, attempt + 1)
      }
      return null
    }
  }, [])

  useEffect(() => {
    if (!videoId) return

    const loadStream = async () => {
      console.log("[v0] Loading stream for videoId:", videoId)
      setStreamUrl(null)
      setIsReady(false)
      setRetryCount(0)
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
      setRetryCount(0)
      onReady?.()

      if (autoRenderEnabled && state.isPlaying) {
        console.log("[v0] Auto-starting playback")
        player.play().catch(console.error)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(player.currentTime)
    }

    const handleError = (e: Event) => {
      console.error("[v0] Innertube player error:", e)
      setIsBuffering(false)

      if (retryCount < 2) {
        console.log(`[v0] Retrying after error (attempt ${retryCount + 1})`)
        setRetryCount((prev) => prev + 1)
        setTimeout(() => {
          const loadStream = async () => {
            const url = await getStreamUrl(videoId)
            setStreamUrl(url)
          }
          loadStream()
        }, 2000)
      } else {
        onError?.(e)
      }
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
      if (autoRenderEnabled && state.currentIndex < state.queue.length - 1) {
        console.log("[v0] Auto-rendering next track")
        setTimeout(() => nextTrack(), 500) // Small delay for smooth transition
      } else {
        console.log("[v0] Auto-rendering disabled or no more tracks")
      }
    }

    const handleLoadStart = () => {
      console.log("[v0] Stream loading started")
      setIsBuffering(true)
    }

    const handleProgress = () => {
      if (player.buffered.length > 0) {
        const bufferedEnd = player.buffered.end(player.buffered.length - 1)
        const duration = player.duration
        if (duration > 0) {
          const bufferedPercent = (bufferedEnd / duration) * 100
          console.log(`[v0] Buffered: ${bufferedPercent.toFixed(1)}%`)
        }
      }
    }

    player.addEventListener("loadedmetadata", handleLoadedMetadata)
    player.addEventListener("timeupdate", handleTimeUpdate)
    player.addEventListener("error", handleError)
    player.addEventListener("ended", handleEnded)
    player.addEventListener("waiting", handleWaiting)
    player.addEventListener("canplay", handleCanPlay)
    player.addEventListener("stalled", handleStalled)
    player.addEventListener("loadstart", handleLoadStart)
    player.addEventListener("progress", handleProgress)

    return () => {
      player.removeEventListener("loadedmetadata", handleLoadedMetadata)
      player.removeEventListener("timeupdate", handleTimeUpdate)
      player.removeEventListener("error", handleError)
      player.removeEventListener("ended", handleEnded)
      player.removeEventListener("waiting", handleWaiting)
      player.removeEventListener("canplay", handleCanPlay)
      player.removeEventListener("stalled", handleStalled)
      player.removeEventListener("loadstart", handleLoadStart)
      player.removeEventListener("progress", handleProgress)
    }
  }, [
    streamUrl,
    setCurrentTime,
    setDuration,
    onReady,
    onError,
    nextTrack,
    state.currentIndex,
    state.queue.length,
    autoRenderEnabled,
    retryCount,
    videoId,
    getStreamUrl,
  ])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return

    if (state.isPlaying && !isBuffering) {
      console.log("[v0] Starting playback")
      player.play().catch((error) => {
        console.error("[v0] Play failed:", error)
        if (error.name === "NotAllowedError") {
          console.log("[v0] Playback blocked by browser, user interaction required")
        }
      })
    } else {
      console.log("[v0] Pausing playback")
      player.pause()
    }
  }, [state.isPlaying, isReady, isBuffering])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return

    if (Math.abs(player.currentTime - state.currentTime) > 0.3) {
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
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <div>Loading stream{retryCount > 0 ? ` (retry ${retryCount})` : ""}...</div>
        </div>
      </div>
    )
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
          bufferSize: "2048000",
          preloadBufferSize: "1024000",
        } as any
      }
    />
  )
}
