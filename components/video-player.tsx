"use client"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useVideoPlayer } from "@/contexts/video-player-context"

export function VideoPlayer() {
  const {
    currentVideo,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    pauseVideo,
    resumeVideo,
    seekTo,
    setVolume,
    toggleMute,
    toggleFullscreen,
  } = useVideoPlayer()

  if (!currentVideo) return null

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleSeek = (value: number[]) => {
    seekTo(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100)
  }

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    seekTo(newTime)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 z-50">
      <div className="flex items-center gap-4 p-4">
        {/* Video info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
            {currentVideo.thumbnail ? (
              <img
                src={currentVideo.thumbnail || "/placeholder.svg"}
                alt={currentVideo.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white text-sm font-medium truncate">{currentVideo.title}</h4>
            <p className="text-zinc-400 text-xs truncate">{currentVideo.artist || "Video"}</p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <Button onClick={() => skipTime(-10)} size="sm" variant="ghost" className="text-white hover:bg-zinc-800 p-2">
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            onClick={isPlaying ? pauseVideo : resumeVideo}
            size="sm"
            className="bg-white text-black hover:bg-zinc-200 w-10 h-10 rounded-full p-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <Button onClick={() => skipTime(10)} size="sm" variant="ghost" className="text-white hover:bg-zinc-800 p-2">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <span className="text-xs text-zinc-400 w-10 text-right">{formatTime(currentTime)}</span>
          <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={handleSeek} className="flex-1" />
          <span className="text-xs text-zinc-400 w-10">{formatTime(duration)}</span>
        </div>

        {/* Volume and fullscreen controls */}
        <div className="flex items-center gap-2">
          <Button onClick={toggleMute} size="sm" variant="ghost" className="text-white hover:bg-zinc-800 p-2">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <div className="flex items-center gap-2 w-20">
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
          </div>

          <Button onClick={toggleFullscreen} size="sm" variant="ghost" className="text-white hover:bg-zinc-800 p-2">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
