"use client"

import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useState } from "react"

export function AudioPlayer() {
  const { state, togglePlay, nextTrack, previousTrack, seekTo, setVolume } = useAudioPlayer()
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  if (!state.currentTrack) {
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-zinc-800 border-t border-zinc-700">
      {/* Progress Bar */}
      <div className="w-full bg-zinc-700 h-1">
        <div className="bg-yellow-400 h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
      </div>

      {/* Player Controls */}
      <div className="flex items-center gap-4 p-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={state.currentTrack.thumbnail || "/placeholder.svg"}
            alt={`${state.currentTrack.title} album cover`}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold truncate">{state.currentTrack.title}</h3>
            <p className="text-gray-400 text-sm truncate">{state.currentTrack.artist}</p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-yellow-400"
            onClick={previousTrack}
            disabled={state.currentIndex <= 0}
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
            onClick={togglePlay}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : state.isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-yellow-400"
            onClick={nextTrack}
            disabled={state.currentIndex >= state.queue.length - 1}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-yellow-400"
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          >
            {state.volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          {showVolumeSlider && (
            <div className="absolute bottom-full right-0 mb-2 bg-zinc-700 rounded-lg p-3 w-32">
              <Slider
                value={[state.volume * 100]}
                onValueChange={(value) => setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Time Display */}
        <div className="text-xs text-gray-400 font-mono">
          {formatTime(state.currentTime)} / {formatTime(state.duration)}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="px-4 pb-2">
          <p className="text-red-400 text-xs">{state.error}</p>
        </div>
      )}
    </div>
  )
}
