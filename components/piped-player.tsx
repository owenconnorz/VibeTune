"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"

interface PipedPlayerProps {
  videoId: string
  showVideo?: boolean
  onReady?: () => void
  onError?: (error: any) => void
}

export function PipedPlayer({ videoId, showVideo = false, onReady, onError }: PipedPlayerProps) {
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
      const response = await fetch("/api/piped/stream", {
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
        return getStreamUrl(videoId, attempt + 1)
      }
      return null
    }
  }, [])

  const handleTimeUpdate = useCallback(
    (e: Event) => {
      const player = playerRef.current
      if (player) {
        setCurrentTime(player.currentTime)
      }
    },
    [setCurrentTime],
  )

  const handleEnded = useCallback(() => {
    console.log("[v0] Piped player ended")
    nextTrack()
  }, [nextTrack])

  const handleWaiting = useCallback(() => {
    console.log("[v0] Piped player waiting")
    setIsBuffering(true)
  }, [])

  const handleCanPlay = useCallback(() => {
    console.log("[v0] Piped player can play")
    setIsBuffering(false)
  }, [])

  const handleStalled = useCallback(() => {
    console.log("[v0] Piped player stalled")
    setIsBuffering(true)
  }, [])

  const handleLoadStart = useCallback(() => {
    console.log("[v0] Piped player load start")
    setIsBuffering(true)
  }, [])

  const handleProgress = useCallback((e: ProgressEvent<HTMLVideoElement>) => {
    console.log("[v0] Piped player progress:", e.loaded, "/", e.total)
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !streamUrl) return

    const handleLoadedMetadata = () => {
      console.log("[v0] Piped player loaded metadata, duration:", player.duration)
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

    const handleError = (e: Event) => {
      console.error("[v0] Piped player error:", e)
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
