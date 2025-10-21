"use client"

import type React from "react"

import { Play, Pause, Heart, Cast } from "lucide-react"
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

export function MiniPlayer() {
  const { currentVideo, isPlaying, togglePlay } = useMusicPlayer()
  const router = useRouter()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [devicePickerOpen, setDevicePickerOpen] = useState(false)

  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    const currentTouch = e.targetTouches[0].clientY
    const diff = touchStart - currentTouch

    if (diff > 0) {
      setDragOffset(Math.min(diff, 100))
    }
    setTouchEnd(currentTouch)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      setDragOffset(0)
      return
    }

    const distance = touchStart - touchEnd
    const isUpSwipe = distance > minSwipeDistance

    if (isUpSwipe) {
      router.push("/dashboard/now-playing")
    }

    setIsDragging(false)
    setDragOffset(0)
    setTouchStart(null)
    setTouchEnd(null)
  }

  if (!currentVideo) return null

  return (
    <>
      <div
        className="fixed bottom-20 left-0 right-0 bg-card border-t border-border z-30 transition-transform touch-none"
        style={{
          transform: `translateY(-${dragOffset}px)`,
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
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setDevicePickerOpen(true)}>
                <Cast className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Heart className="w-5 h-5" />
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
