"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"

export function MusicPlayer() {
  const { currentVideo, isPlaying, togglePlay, playNext, playPrevious } = useMusicPlayer()
  const playerRef = useRef<any>(null)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // @ts-ignore
    window.onYouTubeIframeAPIReady = () => {
      console.log("[v0] YouTube IFrame API ready")
    }
  }, [])

  useEffect(() => {
    if (!currentVideo) return

    // @ts-ignore
    if (window.YT && window.YT.Player) {
      if (playerRef.current) {
        playerRef.current.destroy()
      }

      // @ts-ignore
      playerRef.current = new window.YT.Player("youtube-player", {
        height: "0",
        width: "0",
        videoId: currentVideo.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: (event: any) => {
            console.log("[v0] Player ready")
            event.target.setVolume(volume)
            setDuration(event.target.getDuration())
          },
          onStateChange: (event: any) => {
            console.log("[v0] Player state changed:", event.data)
            // @ts-ignore
            if (event.data === window.YT.PlayerState.ENDED) {
              playNext()
            }
          },
        },
      })
    }
  }, [currentVideo])

  useEffect(() => {
    if (!playerRef.current) return

    if (isPlaying) {
      playerRef.current.playVideo()
    } else {
      playerRef.current.pauseVideo()
    }
  }, [isPlaying])

  useEffect(() => {
    if (!playerRef.current) return

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime()
        setProgress(current)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentVideo])

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume)
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(100)
      if (playerRef.current) {
        playerRef.current.setVolume(100)
      }
    } else {
      setVolume(0)
      if (playerRef.current) {
        playerRef.current.setVolume(0)
      }
    }
    setIsMuted(!isMuted)
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    setProgress(newProgress)
    if (playerRef.current) {
      playerRef.current.seekTo(newProgress)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!currentVideo) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div id="youtube-player" className="hidden" />
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Album Art & Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0">
              <Image
                src={currentVideo.thumbnail || "/placeholder.svg"}
                alt={currentVideo.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm truncate">{currentVideo.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentVideo.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={playPrevious}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button size="icon" onClick={togglePlay} className="w-10 h-10">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={playNext}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(progress)}</span>
              <Slider
                value={[progress]}
                max={duration}
                step={1}
                onValueChange={handleProgressChange}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
