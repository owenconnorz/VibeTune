"use client"
import { X, Plus, Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"

interface Video {
  id: string
  title: string
  url: string
  thumb: string
  sources?: { [quality: string]: string } // Added sources for multiple quality options
}

interface VideoPlayerProps {
  video: Video | null
  onClose: () => void
  onAddToPlaylist: (video: Video) => void
}

export function VideoPlayer({ video, onClose, onAddToPlaylist }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (video && videoRef.current) {
      setIsLoading(true)
      setHasError(false)

      const videoElement = videoRef.current

      videoElement.innerHTML = ""

      // Add multiple source elements for different qualities
      if (video.sources) {
        Object.entries(video.sources).forEach(([quality, url]) => {
          const source = document.createElement("source")
          source.src = url
          source.type = "video/mp4"
          videoElement.appendChild(source)
        })
      } else {
        // Fallback to single source
        const source = document.createElement("source")
        source.src = video.url
        source.type = "video/mp4"
        videoElement.appendChild(source)
      }

      videoElement.load()

      const handleLoadStart = () => {
        console.log("[v0] Video load started")
        setIsLoading(true)
      }
      const handleCanPlay = () => {
        console.log("[v0] Video can play")
        setIsLoading(false)
      }
      const handleError = (e: any) => {
        console.log("[v0] Video load error:", e)
        setHasError(true)
        setIsLoading(false)
      }
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)

      videoElement.addEventListener("loadstart", handleLoadStart)
      videoElement.addEventListener("canplay", handleCanPlay)
      videoElement.addEventListener("error", handleError)
      videoElement.addEventListener("play", handlePlay)
      videoElement.addEventListener("pause", handlePause)

      return () => {
        videoElement.removeEventListener("loadstart", handleLoadStart)
        videoElement.removeEventListener("canplay", handleCanPlay)
        videoElement.removeEventListener("error", handleError)
        videoElement.removeEventListener("play", handlePlay)
        videoElement.removeEventListener("pause", handlePause)
      }
    }
  }, [video])

  if (!video) return null

  const handlePlayVideo = () => {
    if (hasError) {
      window.open(video.url, "_blank")
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => {
          console.log("[v0] HTML5 video play failed, opening in external player")
          window.open(video.url, "_blank")
        })
      }
    }
  }

  const handleWatchInBrowser = () => {
    window.open(video.url, "_blank", "width=1200,height=800")
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-end justify-center">
      <div className="absolute top-4 right-4 z-10">
        <Button onClick={onClose} size="sm" variant="ghost" className="text-white hover:bg-white/20">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-xl">Loading video...</div>
        </div>
      )}

      {!isLoading && (
        <div className="w-full max-w-md mx-4 mb-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-white font-medium text-lg mb-6 leading-tight">{video.title}</h3>

          <div className="flex flex-col gap-3">
            {!hasError && (
              <Button
                onClick={handlePlayVideo}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                {isPlaying ? "Pause Video" : "Play Video"}
              </Button>
            )}

            <Button
              onClick={handleWatchInBrowser}
              variant="outline"
              className="w-full border-gray-600 text-white hover:bg-gray-700 bg-transparent py-3"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Watch in Browser
            </Button>

            <Button
              onClick={() => onAddToPlaylist(video)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-orange-500 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add to Playlist
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
