"use client"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Settings, X } from "lucide-react"
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
    stopVideo,
  } = useVideoPlayer()

  if (!currentVideo || !isFullscreen) return null

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
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Exit button at top */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={() => {
            toggleFullscreen()
            stopVideo()
          }}
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20 p-2 rounded-full"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center relative">
        {currentVideo.thumbnail && (
          <img
            src={currentVideo.thumbnail || "/placeholder.svg"}
            alt={currentVideo.title}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Mux Player placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">{currentVideo.title}</h2>
            <p className="text-lg text-white/80">Powered by Mux Player</p>
          </div>
        </div>
      </div>

      {/* Fullscreen controls */}
      <div className="bg-gradient-to-t from-black/90 to-transparent p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-white text-sm w-12">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
            </div>
            <span className="text-white text-sm w-12">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <Button
            onClick={() => skipTime(-10)}
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/20 p-3 rounded-full"
          >
            <SkipBack className="w-6 h-6" />
          </Button>

          <Button
            onClick={isPlaying ? pauseVideo : resumeVideo}
            size="lg"
            className="bg-white text-black hover:bg-white/90 w-16 h-16 rounded-full p-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            ) : isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </Button>

          <Button
            onClick={() => skipTime(10)}
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/20 p-3 rounded-full"
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={toggleMute} size="sm" variant="ghost" className="text-white hover:bg-white/20 p-2">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <div className="w-24">
              <Slider value={[isMuted ? 0 : volume * 100]} max={100} step={1} onValueChange={handleVolumeChange} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 p-2" title="Video Quality">
              <Settings className="w-5 h-5" />
            </Button>
            <span className="text-white/60 text-sm">Mux Player • Adaptive Streaming</span>
          </div>
        </div>
      </div>
    </div>
  )
}
