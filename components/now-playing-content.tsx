"use client"

import type React from "react"
import dynamic from "next/dynamic"

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
import { useState, useEffect } from "react"

const NowPlayingMenu = dynamic(() => import("@/components/now-playing-menu").then((mod) => mod.NowPlayingMenu), {
  ssr: false,
})

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

  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
    setTouchEnd(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientY)
    const offset = e.touches[0].clientY - touchStart

    if (offset > 0) {
      e.preventDefault()
      setDragOffset(offset)
    }
  }

  const handleTouchEnd = () => {
    const swipeDistance = touchEnd - touchStart
    if (swipeDistance > 100) {
      router.back()
    }
    setDragOffset(0)
  }

  if (!currentVideo) {
    router.push("/dashboard")
    return null
  }

  return (
    <>
      <div
        className="h-screen bg-gradient-to-b from-primary/20 to-background flex flex-col overflow-hidden overscroll-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: dragOffset === 0 ? "transform 0.3s ease-out" : "none",
          overscrollBehavior: "contain",
        }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-between px-4 py-4 min-h-0">
          <div className="w-full max-w-md flex flex-col h-full justify-between space-y-4">
            <div className="text-center flex-shrink-0">
              <p className="text-sm text-muted-foreground mb-1">Now Playing</p>
              <h2 className="text-lg font-semibold">music 🎶</h2>
            </div>

            <div className="relative w-full max-h-[40vh] aspect-square rounded-3xl overflow-hidden shadow-2xl flex-shrink-0">
              <Image
                src={currentVideo.thumbnail || "/placeholder.svg"}
                alt={currentVideo.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="text-center space-y-1 flex-shrink-0">
              <h1 className="text-xl font-bold line-clamp-1">{currentVideo.title}</h1>
              <p className="text-base text-muted-foreground line-clamp-1">{currentVideo.artist}</p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1 flex-shrink-0">
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

            <div className="flex items-center justify-center gap-4 flex-shrink-0">
              <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full" onClick={playPrevious}>
                <SkipBack className="w-6 h-6" />
              </Button>
              <Button size="icon" className="w-16 h-16 rounded-full bg-primary" onClick={togglePlay}>
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full" onClick={playNext}>
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
                className="flex-1"
              />
            </div>

            <div className="flex items-center justify-around flex-shrink-0">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <List className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <Moon className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <Sliders className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <Repeat className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => setMenuOpen(true)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {mounted && (
        <NowPlayingMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          volume={volume}
          setVolume={setVolume}
          currentVideo={currentVideo}
        />
      )}
    </>
  )
}
