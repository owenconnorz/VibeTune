"use client"

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Share2,
  Heart,
  List,
  Moon,
  Sliders,
  Repeat,
  MoreVertical,
  Volume2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function NowPlayingContent() {
  const {
    currentVideo,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    currentTime,
    duration,
    seekTo,
    volume,
    setVolume,
  } = useMusicPlayer()
  const router = useRouter()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!currentVideo) {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Now Playing</p>
            <h2 className="text-lg font-semibold">music 🎶</h2>
          </div>

          {/* Album Art */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src={currentVideo.thumbnail || "/placeholder.svg"}
              alt={currentVideo.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Song Info */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{currentVideo.title}</h1>
            <p className="text-lg text-muted-foreground">{currentVideo.artist}</p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Share2 className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Heart className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={(value) => seekTo(value[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full" onClick={playPrevious}>
              <SkipBack className="w-7 h-7" />
            </Button>
            <Button size="icon" className="w-20 h-20 rounded-full bg-primary" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-9 h-9" /> : <Play className="w-9 h-9 fill-current" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full" onClick={playNext}>
              <SkipForward className="w-7 h-7" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="flex-1"
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-around pt-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <List className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Moon className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Sliders className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Repeat className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
