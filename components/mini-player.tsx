"use client"

import type React from "react"

import { Play, Pause, Heart, Cast, SkipBack, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const AudioDevicePicker = dynamic(
  () => import("@/components/audio-device-picker").then((mod) => mod.AudioDevicePicker),
  {
    ssr: false,
  },
)

export function MiniPlayer() {
  const { currentVideo, isPlaying, togglePlay, playNext, playPrevious, isCurrentLiked, toggleLikedSong } =
    useMusicPlayer()
  const router = useRouter()
  const pathname = usePathname()

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [devicePickerOpen, setDevicePickerOpen] = useState(false)
  const [touchStartedOnButton, setTouchStartedOnButton] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const minSwipeDistance = 30
  const expandThreshold = 100 // Distance to trigger full expansion

  const isPlaylistPage = pathname?.includes("/playlist/")

  useEffect(() => {
    if (isPlaylistPage && currentVideo) {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [isPlaylistPage, currentVideo])

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    const isButton = target.closest("button") !== null
    setTouchStartedOnButton(isButton)

    if (isButton) {
      return
    }

    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartedOnButton || !touchStart) return

    const currentX = e.targetTouches[0].clientX
    const currentY = e.targetTouches[0].clientY
    const diffX = currentX - touchStart.x
    const diffY = touchStart.y - currentY // Positive when swiping up

    const isHorizontal = Math.abs(diffX) > Math.abs(diffY)

    if (isHorizontal) {
      setDragOffset({ x: diffX, y: 0 })
    } else if (diffY > 0) {
      // Swiping up - allow drag with resistance
      const resistance = 0.6 // Add resistance to make it feel natural
      const adjustedY = Math.min(diffY * resistance, window.innerHeight * 0.8)
      setDragOffset({ x: 0, y: adjustedY })

      // Prevent page scroll when dragging
      if (diffY > 10) {
        e.preventDefault()
      }
    }

    setTouchEnd({ x: currentX, y: currentY })
  }

  const handleTouchEnd = () => {
    if (touchStartedOnButton) {
      setTouchStartedOnButton(false)
      setIsDragging(false)
      setDragOffset({ x: 0, y: 0 })
      return
    }

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

    if (!isHorizontal && distanceY > expandThreshold) {
      // Smooth transition to now-playing
      router.push("/dashboard/now-playing")
    } else if (isHorizontal) {
      if (isLeftSwipe) {
        playNext()
      } else if (isRightSwipe) {
        playPrevious()
      }
    } else if (isUpSwipe) {
      router.push("/dashboard/now-playing")
    }

    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
    setTouchStart(null)
    setTouchEnd(null)
    setTouchStartedOnButton(false)
  }

  const handleCastClick = () => {
    setDevicePickerOpen(true)
  }

  const handlePreviousClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    playPrevious()
  }

  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    playNext()
  }

  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    togglePlay()
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (currentVideo) {
      toggleLikedSong(currentVideo)
    }
  }

  if (!currentVideo) return null

  const dragProgress = Math.min(dragOffset.y / expandThreshold, 1)
  const scale = 1 + dragProgress * 0.05 // Slight scale up
  const miniPlayerOpacity = 1 - dragProgress * 0.3 // Fade out slightly

  return (
    <>
      <div
        className={`fixed left-0 right-0 bg-card border-t border-border z-30 touch-none ${
          isPlaylistPage ? `bottom-0 ${isVisible ? "translate-y-0" : "translate-y-full"}` : "bottom-20"
        }`}
        style={{
          transform: isDragging
            ? `translate(${dragOffset.x}px, -${dragOffset.y}px) scale(${scale})`
            : isPlaylistPage && !isVisible
              ? "translateY(100%)"
              : "translateY(0)",
          opacity: isDragging ? miniPlayerOpacity : 1,
          transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "center bottom",
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
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={handleLikeClick}>
                <Heart className={`w-4 h-4 ${isCurrentLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={handlePreviousClick}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="icon" onClick={handlePlayPauseClick} className="rounded-full w-11 h-11">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={handleNextClick}>
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={handleCastClick}>
                <Cast className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AudioDevicePicker open={devicePickerOpen} onOpenChange={setDevicePickerOpen} />
    </>
  )
}
