"use client"

import { ExternalLink, Play, X, AlertCircle, Globe } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VideoService {
  id: string
  name: string
  url: string
  description: string
  logo: string
  color: string
  embedSupport: "full" | "limited" | "none"
  embedUrl?: string
}

const videoServices: VideoService[] = [
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com",
    description: "Watch billions of videos, music, and live streams",
    logo: "🎥",
    color: "from-red-500 to-red-600",
    embedSupport: "full",
    embedUrl: "https://www.youtube.com",
  },
  {
    id: "vimeo",
    name: "Vimeo",
    url: "https://vimeo.com",
    description: "High-quality video platform for creators",
    logo: "🎬",
    color: "from-blue-500 to-blue-600",
    embedSupport: "full",
    embedUrl: "https://vimeo.com",
  },
  {
    id: "dailymotion",
    name: "Dailymotion",
    url: "https://www.dailymotion.com",
    description: "Discover and share videos from around the world",
    logo: "📹",
    color: "from-cyan-500 to-cyan-600",
    embedSupport: "full",
    embedUrl: "https://www.dailymotion.com",
  },
  {
    id: "twitch",
    name: "Twitch",
    url: "https://www.twitch.tv",
    description: "Live streaming platform for gaming and more",
    logo: "🎮",
    color: "from-purple-500 to-purple-600",
    embedSupport: "limited",
    embedUrl: "https://www.twitch.tv",
  },
  {
    id: "tiktok",
    name: "TikTok",
    url: "https://www.tiktok.com",
    description: "Short-form video entertainment",
    logo: "🎵",
    color: "from-pink-500 to-pink-600",
    embedSupport: "none",
  },
  {
    id: "netflix",
    name: "Netflix",
    url: "https://www.netflix.com",
    description: "Stream movies, TV shows, and originals",
    logo: "🎞️",
    color: "from-red-600 to-red-700",
    embedSupport: "none",
  },
  {
    id: "prime-video",
    name: "Prime Video",
    url: "https://www.primevideo.com",
    description: "Amazon's streaming service",
    logo: "📺",
    color: "from-blue-600 to-blue-700",
    embedSupport: "none",
  },
  {
    id: "disney-plus",
    name: "Disney+",
    url: "https://www.disneyplus.com",
    description: "Disney, Pixar, Marvel, Star Wars & more",
    logo: "✨",
    color: "from-indigo-500 to-indigo-600",
    embedSupport: "none",
  },
]

export function VideosContent() {
  const [activeService, setActiveService] = useState<VideoService | null>(null)
  const [iframeError, setIframeError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [customUrl, setCustomUrl] = useState("")
  const [urlError, setUrlError] = useState("")

  const handleOpenService = (service: VideoService) => {
    if (service.embedSupport === "none") {
      window.open(service.url, "_blank", "noopener,noreferrer")
    } else {
      setActiveService(service)
      setIframeError(false)
      setIsLoading(true)

      setTimeout(() => {
        setIsLoading(false)
        setIframeError(true)
      }, 5000)
    }
  }

  const handleClose = () => {
    setActiveService(null)
    setIframeError(false)
    setIsLoading(false)
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setIframeError(true)
    setIsLoading(false)
  }

  const handleOpenCustomUrl = () => {
    setUrlError("")

    if (!customUrl.trim()) {
      setUrlError("Please enter a URL")
      return
    }

    let url = customUrl.trim()

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    try {
      new URL(url)
    } catch {
      setUrlError("Please enter a valid URL")
      return
    }

    const customService: VideoService = {
      id: "custom",
      name: "Custom Website",
      url: url,
      description: url,
      logo: "🌐",
      color: "from-gray-500 to-gray-600",
      embedSupport: "full",
      embedUrl: url,
    }

    setActiveService(customService)
    setIframeError(false)
    setIsLoading(true)
    setCustomUrl("")

    setTimeout(() => {
      setIsLoading(false)
      setIframeError(true)
    }, 5000)
  }

  if (activeService) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeService.logo}</span>
            <div>
              <h2 className="font-bold text-lg">{activeService.name}</h2>
              <p className="text-xs text-muted-foreground">{activeService.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(activeService.url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {iframeError && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>This website blocks embedding for security reasons.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(activeService.url, "_blank", "noopener,noreferrer")
                  handleClose()
                }}
              >
                Open Externally
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 relative bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground">Loading {activeService.name}...</p>
                <p className="text-xs text-muted-foreground">If nothing loads, the site may block embedding</p>
              </div>
            </div>
          )}
          <iframe
            src={activeService.embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Streaming Services</h2>
          <p className="text-muted-foreground">Browse your favorite video platforms</p>
        </div>

        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Open Custom Website</h3>
            </div>
            <p className="text-sm text-muted-foreground">Enter any website URL to open it in the app viewer</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="Enter URL (e.g., youtube.com or https://example.com)"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value)
                    setUrlError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleOpenCustomUrl()
                    }
                  }}
                  className={urlError ? "border-red-500" : ""}
                />
                {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
              </div>
              <Button onClick={handleOpenCustomUrl}>
                <Play className="w-4 h-4 mr-2" />
                Open
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videoServices.map((service) => (
            <Card
              key={service.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleOpenService(service)}
            >
              <div className={`h-24 bg-gradient-to-br ${service.color} flex items-center justify-center relative`}>
                <span className="text-6xl">{service.logo}</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{service.name}</h3>
                      {service.embedSupport === "full" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                          In-App
                        </span>
                      )}
                      {service.embedSupport === "limited" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                          Limited
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(service.url, "_blank", "noopener,noreferrer")
                    }}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </div>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenService(service)
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {service.embedSupport === "none" ? "Open Externally" : "Open " + service.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-lg bg-muted/50 border border-border space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <span>ℹ️</span>
            <span>Viewing Options</span>
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium text-foreground">In-App:</span>
              </span>{" "}
              Opens within the music app for seamless browsing
            </p>
            <p>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="font-medium text-foreground">Limited:</span>
              </span>{" "}
              May have restricted features when embedded
            </p>
            <p>
              Services without badges will open in a new tab. You may need to sign in to access subscription content.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
