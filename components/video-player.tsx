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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-4xl mx-4 bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <Button onClick={onClose} size="sm" variant="ghost" className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          {!hasError ? (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-96 bg-black"
                controls
                poster={video.thumb}
                preload="metadata"
                crossOrigin="anonymous"
                playsInline // Added playsInline for better mobile support
              >
                {/* Sources are added dynamically in useEffect */}
                Your browser does not support the video tag.
              </video>

              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white">Loading video...</div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <img src={video.thumb || "/placeholder.svg"} alt={video.title} className="w-full h-96 object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="mb-4">Video cannot be played directly</p>
                  <Button
                    onClick={handlePlayVideo}
                    size="lg"
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                  >
                    <ExternalLink className="w-6 h-6 mr-2" />
                    Open in External Player
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-white font-medium text-xl mb-4">{video.title}</h3>

          <div className="flex flex-col gap-3">
            {!hasError && (
              <Button onClick={handlePlayVideo} className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold">
                <Play className="w-4 h-4 mr-2" />
                {isPlaying ? "Pause Video" : "Play Video"}
              </Button>
            )}

            <Button
              onClick={handleWatchInBrowser}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Watch in Browser
            </Button>

            <Button
              onClick={() => onAddToPlaylist(video)}
              variant="outline"
              className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Playlist
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
