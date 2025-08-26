"use client"
import { X, Plus, Play, ExternalLink, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"

interface Video {
  id: string
  title: string
  url: string
  embed?: string // Added embed URL for iframe playback
  thumb: string
  sources?: { [quality: string]: string }
}

interface VideoPlayerProps {
  video: Video | null
  onClose: () => void
  onAddToPlaylist: (video: Video) => void
}

export function VideoPlayer({ video, onClose, onAddToPlaylist }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [useIframe, setUseIframe] = useState(false) // Added iframe mode toggle

  useEffect(() => {
    if (video) {
      setIsLoading(true)
      setHasError(false)
      setIsPlaying(false)

      if (video.embed) {
        setUseIframe(true)
        setIsLoading(false)
        return
      }

      if (videoRef.current) {
        const videoElement = videoRef.current
        videoElement.innerHTML = ""

        if (video.sources) {
          Object.entries(video.sources).forEach(([quality, url]) => {
            const source = document.createElement("source")
            source.src = url
            source.type = "video/mp4"
            videoElement.appendChild(source)
          })
        } else {
          const source = document.createElement("source")
          source.src = video.url
          source.type = "video/mp4"
          videoElement.appendChild(source)
        }

        videoElement.load()

        const handleLoadStart = () => setIsLoading(true)
        const handleCanPlay = () => setIsLoading(false)
        const handleError = () => {
          setHasError(true)
          setIsLoading(false)
          if (video.embed) {
            setUseIframe(true)
            setHasError(false)
          }
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
    }
  }, [video])

  if (!video) return null

  const handlePlayVideo = () => {
    if (useIframe || hasError) {
      const embedUrl = video.embed || video.url
      window.open(embedUrl, "_blank", "width=1200,height=800,scrollbars=yes,resizable=yes")
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => {
          if (video.embed) {
            setUseIframe(true)
            setHasError(false)
          } else {
            window.open(video.url, "_blank")
          }
        })
      }
    }
  }

  const handleWatchInBrowser = () => {
    const watchUrl = video.embed || video.url
    window.open(watchUrl, "_blank", "width=1200,height=800,scrollbars=yes,resizable=yes")
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-gray-900/50">
        <h3 className="text-white font-medium text-lg flex-1 pr-4 leading-tight">{video.title}</h3>
        <Button onClick={onClose} size="sm" variant="ghost" className="text-white hover:bg-white/20">
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {isLoading && (
          <div className="text-white text-xl flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            Loading video...
          </div>
        )}

        {!isLoading && useIframe && video.embed && (
          <div className="w-full max-w-4xl aspect-video">
            <iframe
              ref={iframeRef}
              src={video.embed}
              className="w-full h-full rounded-lg"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={video.title}
            />
          </div>
        )}

        {!isLoading && !useIframe && !hasError && (
          <div className="w-full max-w-4xl aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full rounded-lg bg-black"
              controls
              poster={video.thumb}
              preload="metadata"
            />
          </div>
        )}

        {hasError && !useIframe && (
          <div className="text-center text-white">
            <p className="mb-4">Unable to load video player</p>
            <Button onClick={handleWatchInBrowser} className="bg-orange-500 hover:bg-orange-600">
              <ExternalLink className="w-5 h-5 mr-2" />
              Watch in Browser
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-900/50">
        <div className="flex flex-wrap gap-3 justify-center max-w-md mx-auto">
          <Button
            onClick={handlePlayVideo}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2"
          >
            {useIframe ? (
              <>
                <ExternalLink className="w-5 h-5 mr-2" />
                Open Player
              </>
            ) : (
              <>
                {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </>
            )}
          </Button>

          <Button
            onClick={handleWatchInBrowser}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-700 bg-transparent px-6 py-2"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Browser
          </Button>

          <Button
            onClick={() => onAddToPlaylist(video)}
            className="bg-gray-700 hover:bg-gray-600 text-orange-500 px-6 py-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Playlist
          </Button>
        </div>
      </div>
    </div>
  )
}
