"use client"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Settings, X, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useVideoPlayer } from "@/contexts/video-player-context"
import { useEffect, useRef, useState } from "react"

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      const video = videoRef.current

      console.log("[v0] HTML5 Video Player: Setting up video element")
      console.log("[v0] Video URL:", currentVideo.videoUrl || currentVideo.url)

      // Set video source
      if (currentVideo.videoUrl || currentVideo.url) {
        video.src = currentVideo.videoUrl || currentVideo.url || ""
        video.load() // Ensure video loads properly
      }

      // Add event listeners for HTML5 video
      const handleLoadedData = () => {
        console.log("[v0] HTML5 Video: Video loaded and ready to play")
        if (isPlaying) {
          video.play().catch(console.error)
        }
      }

      const handleTimeUpdate = () => {
        // Update context with current time from video element
        if (Math.abs(video.currentTime - currentTime) > 1) {
          seekTo(video.currentTime)
        }
      }

      const handleLoadedMetadata = () => {
        console.log("[v0] HTML5 Video: Metadata loaded, duration:", video.duration)
      }

      const handleError = (e: Event) => {
        console.error("[v0] HTML5 Video Error:", e)
      }

      video.addEventListener("loadeddata", handleLoadedData)
      video.addEventListener("timeupdate", handleTimeUpdate)
      video.addEventListener("loadedmetadata", handleLoadedMetadata)
      video.addEventListener("error", handleError)

      // Sync playback state
      if (isPlaying && video.paused) {
        video.play().catch(console.error)
      } else if (!isPlaying && !video.paused) {
        video.pause()
      }

      // Sync volume and mute
      video.volume = volume
      video.muted = isMuted

      return () => {
        video.removeEventListener("loadeddata", handleLoadedData)
        video.removeEventListener("timeupdate", handleTimeUpdate)
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("error", handleError)
      }
    }
  }, [currentVideo, isPlaying, volume, isMuted])

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }
    const timeout = setTimeout(() => {
      setShowControls(false)
    }, 3000)
    setControlsTimeout(timeout)
  }

  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout])

  if (!currentVideo || !isFullscreen) return null

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      seekTo(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(
        0,
        Math.min(videoRef.current.duration || duration, videoRef.current.currentTime + seconds),
      )
      videoRef.current.currentTime = newTime
      seekTo(newTime)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black z-[100] flex flex-col cursor-none"
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(!showControls)}
    >
      <div
        className={`absolute top-4 left-4 text-white transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        <h2 className="text-xl font-bold mb-1">{currentVideo.title}</h2>
        <p className="text-sm text-white/80">HTML5 Video Player • Direct Playback</p>
      </div>

      {/* Exit button at top */}
      <div
        className={`absolute top-4 right-4 z-10 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
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

      <div className="flex-1 flex items-center justify-center relative">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls={false}
          playsInline
          crossOrigin="anonymous"
          preload="metadata"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          <source src={currentVideo.videoUrl || currentVideo.url} type="video/mp4" />
          <source src={currentVideo.videoUrl || currentVideo.url} type="video/webm" />
          <source src={currentVideo.videoUrl || currentVideo.url} type="video/ogg" />
          Your browser does not support the video tag.
        </video>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
              <p className="text-lg">Loading video...</p>
            </div>
          </div>
        )}

        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={resumeVideo}
              size="lg"
              className="bg-white/20 text-white hover:bg-white/30 w-20 h-20 rounded-full p-0 backdrop-blur-sm"
            >
              <Play className="w-10 h-10" />
            </Button>
          </div>
        )}
      </div>

      <div
        className={`bg-gradient-to-t from-black/90 to-transparent p-6 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-white text-sm w-12">{formatTime(videoRef.current?.currentTime || currentTime)}</span>
            <div className="flex-1">
              <Slider
                value={[videoRef.current?.currentTime || currentTime]}
                max={videoRef.current?.duration || duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
              />
            </div>
            <span className="text-white text-sm w-12">{formatTime(videoRef.current?.duration || duration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <Button
            onClick={() => skipTime(-30)}
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/20 p-3 rounded-full"
            title="Skip back 30s"
          >
            <SkipBack className="w-6 h-6" />
          </Button>

          <Button
            onClick={() => skipTime(-10)}
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/20 p-3 rounded-full"
            title="Skip back 10s"
          >
            <div className="relative">
              <SkipBack className="w-5 h-5" />
              <span className="absolute -bottom-1 -right-1 text-xs">10</span>
            </div>
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
            title="Skip forward 10s"
          >
            <div className="relative">
              <SkipForward className="w-5 h-5" />
              <span className="absolute -bottom-1 -right-1 text-xs">10</span>
            </div>
          </Button>

          <Button
            onClick={() => skipTime(30)}
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/20 p-3 rounded-full"
            title="Skip forward 30s"
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
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
              />
            </div>
            <span className="text-white/60 text-sm">{Math.round(volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 p-2" title="Playback Speed">
              <span className="text-sm">1x</span>
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 p-2" title="Video Quality">
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              onClick={toggleFullscreen}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-2"
              title="Exit Fullscreen"
            >
              <Minimize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
