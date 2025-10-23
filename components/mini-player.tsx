"use client"

import type React from "react"

import { Play, Pause, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import dynamic from "next/dynamic"

const AudioDevicePicker = dynamic(
  () => import("@/components/audio-device-picker").then((mod) => mod.AudioDevicePicker),
  {
    ssr: false,
  },
)

const CastButton = dynamic(() => import("@/components/cast-button").then((mod) => mod.CastButton), {
  ssr: false,
})

export function MiniPlayer() {
  const { currentVideo, isPlaying, togglePlay, playNext, playPrevious, isCurrentLiked, toggleLikedSong } =
    useMusicPlayer()
  const router = useRouter()

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [devicePickerOpen, setDevicePickerOpen] = useState(false)

  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return

    const currentX = e.targetTouches[0].clientX
    const currentY = e.targetTouches[0].clientY
    const diffX = currentX - touchStart.x
    const diffY = touchStart.y - currentY

    // Determine if swipe is more horizontal or vertical
    const isHorizontal = Math.abs(diffX) > Math.abs(diffY)

    if (isHorizontal) {
      // Horizontal swipe for skip/previous
      setDragOffset({ x: diffX, y: 0 })
    } else if (diffY > 0) {
      // Vertical swipe up for now-playing
      setDragOffset({ x: 0, y: Math.min(diffY, 100) })
    }

    setTouchEnd({ x: currentX, y: currentY })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      setDragOffset({ x: 0, y: 0 })
      return
    }

    const distanceX = touchEnd.x - touchStart.x
    const distanceY = touchStart.y - touchEnd.y

    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY)
    const isLeftSwipe = distanceX < -minSwipeDistance
    const isRightSwipe = distanceX > minSwipeDistance
    const isUpSwipe = distanceY > minSwipeDistance

    if (isHorizontal) {
      if (isLeftSwipe) {
        console.log("[v0] Swiped left - playing next song")
        playNext()
      } else if (isRightSwipe) {
        console.log("[v0] Swiped right - playing previous song")
        playPrevious()
      }
    } else if (isUpSwipe) {
      // Handle vertical swipe for now-playing
      router.push("/dashboard/now-playing")
    }

    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
    setTouchStart(null)
    setTouchEnd(null)
  }

  if (!currentVideo) return null

  return (
    <>
      <div
        className="fixed bottom-20 left-0 right-0 bg-card border-t border-border z-30 transition-transform touch-none"
        style={{
          transform: `translate(${dragOffset.x}px, -${dragOffset.y}px)`,
          opacity: isDragging ? 0.9 : 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/30 rounded-full" />

        <div className="container mx-auto px-4 py-3 pt-5">
          <div className="flex items-center gap-3">
            <div
              onClick={() => router.push("/dashboard/now-playing")}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={currentVideo.thumbnail || "/placeholder.svg"}
                  alt={currentVideo.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{currentVideo.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{currentVideo.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CastButton size="icon" className="rounded-full" />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => currentVideo && toggleLikedSong(currentVideo)}
              >
                <Heart className={`w-5 h-5 ${isCurrentLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button size="icon" onClick={togglePlay} className="rounded-full w-12 h-12">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AudioDevicePicker open={devicePickerOpen} onOpenChange={setDevicePickerOpen} />
    </>
  )
}
