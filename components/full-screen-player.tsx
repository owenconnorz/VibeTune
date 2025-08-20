"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Share,
  MoreHorizontal,
  List,
  Moon,
  BarChart3,
  Repeat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useAudioPlayer } from "@/contexts/audio-player-context"

interface FullScreenPlayerProps {
  isOpen: boolean
  onClose: () => void
}

export function FullScreenPlayer({ isOpen, onClose }: FullScreenPlayerProps) {
  const { state, togglePlay, nextTrack, previousTrack, seekTo } = useAudioPlayer()
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY.current
    if (deltaY > 0) {
      // Only allow downward swipe
      setDragY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (dragY > 100) {
      // Threshold for closing
      onClose()
    }
    setDragY(0)
    setIsDragging(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!isOpen || !state.currentTrack) return null

  const progressPercentage = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-gradient-to-b from-teal-500 via-emerald-400 to-orange-400 transition-transform duration-300 ${
        isDragging ? "transition-none" : ""
      } overflow-hidden`}
      style={{
        transform: `translateY(${dragY}px)`,
        opacity: isDragging ? Math.max(0.5, 1 - dragY / 300) : 1,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4">
        <div className="text-center">
          <h1 className="text-white text-lg sm:text-xl font-semibold">Now Playing</h1>
          <p className="text-white/80 text-xs sm:text-sm mt-1">CHRONOLOGY</p>
        </div>
      </div>

      {/* Drag Indicator */}
      <div className="flex justify-center mb-4 sm:mb-8">
        <div className="w-12 h-1 bg-white/30 rounded-full"></div>
      </div>

      <div className="flex justify-center px-4 sm:px-8 mb-6 sm:mb-8">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 max-w-[90vw] max-h-[40vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <img
            src={state.currentTrack.thumbnail || "/placeholder.svg"}
            alt={`${state.currentTrack.title} album cover`}
            className="w-full h-full object-cover"
          />
          {/* Overlay text effect like in the reference */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-4xl sm:text-6xl font-bold opacity-20 transform rotate-12">
              {state.currentTrack.artist?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 mb-4 sm:mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-1 leading-tight line-clamp-2">
              {state.currentTrack.title}
            </h2>
            <p className="text-white/80 text-base sm:text-lg truncate">{state.currentTrack.artist}</p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12"
            >
              <Share className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 mb-6 sm:mb-6">
        <div className="relative">
          <Slider
            value={[progressPercentage]}
            onValueChange={(value) => {
              const newTime = (value[0] / 100) * state.duration
              seekTo(newTime)
            }}
            max={100}
            step={0.1}
            className="w-full [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 sm:[&_[role=slider]]:h-5 sm:[&_[role=slider]]:w-5"
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-white/60 text-sm">{formatTime(state.currentTime)}</span>
          <span className="text-white/60 text-sm">{formatTime(state.duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 sm:gap-6 px-4 sm:px-8 mb-6 sm:mb-8">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-14 h-14 sm:w-16 sm:h-16"
          onClick={previousTrack}
          disabled={state.currentIndex <= 0}
        >
          <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-white bg-white/20 hover:bg-white/30 rounded-full w-16 h-16 sm:w-20 sm:h-20"
          onClick={togglePlay}
          disabled={state.isLoading}
        >
          {state.isLoading ? (
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : state.isPlaying ? (
            <Pause className="w-6 h-6 sm:w-8 sm:h-8" />
          ) : (
            <Play className="w-6 h-6 sm:w-8 sm:h-8" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-14 h-14 sm:w-16 sm:h-16"
          onClick={nextTrack}
          disabled={state.currentIndex >= state.queue.length - 1}
        >
          <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      </div>

      <div className="flex items-center justify-between px-6 sm:px-8 pb-6 sm:pb-8">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
        >
          <List className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
        >
          <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
        >
          <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
        >
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  )
}
