"use client"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, X } from "lucide-react"
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

  // Fullscreen player with all Mux controls and exit button
  if (isFullscreen) {
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-zinc-800 z-50">
      <div className="flex items-center gap-4 p-4">
        {/* Video info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 bg-zinc-800 rounded overflow-hidden flex-shrink-0 relative">
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
            <div
              className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full opacity-75"
              title="Mux Player Active"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white text-sm font-medium truncate">{currentVideo.title}</h4>
            <p className="text-zinc-400 text-xs truncate">{currentVideo.artist || "Video"} • Mux Player</p>
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
            className="bg-white text-black hover:bg-zinc-200 w-10 h-10 rounded-full p-0 transition-all duration-200"
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
          <div className="flex-1 relative">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-700 rounded-full -translate-y-1/2 -z-10" />
          </div>
          <span className="text-xs text-zinc-400 w-10">{formatTime(duration)}</span>
        </div>

        {/* Volume and controls */}
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

          <Button size="sm" variant="ghost" className="text-white hover:bg-zinc-800 p-2" title="Video Quality">
            <Settings className="w-4 h-4" />
          </Button>

          <Button onClick={toggleFullscreen} size="sm" variant="ghost" className="text-white hover:bg-zinc-800 p-2">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Powered by Mux Player</span>
          <span className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            Adaptive Streaming Active
          </span>
        </div>
      </div>
    </div>
  )
}
