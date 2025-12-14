"use client"

import { ExternalLink, Play } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface VideoService {
  id: string
  name: string
  url: string
  description: string
  logo: string
  color: string
}

const videoServices: VideoService[] = [
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com",
    description: "Watch billions of videos, music, and live streams",
    logo: "🎥",
    color: "from-red-500 to-red-600",
  },
  {
    id: "vimeo",
    name: "Vimeo",
    url: "https://vimeo.com",
    description: "High-quality video platform for creators",
    logo: "🎬",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "dailymotion",
    name: "Dailymotion",
    url: "https://www.dailymotion.com",
    description: "Discover and share videos from around the world",
    logo: "📹",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    id: "twitch",
    name: "Twitch",
    url: "https://www.twitch.tv",
    description: "Live streaming platform for gaming and more",
    logo: "🎮",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "tiktok",
    name: "TikTok",
    url: "https://www.tiktok.com",
    description: "Short-form video entertainment",
    logo: "🎵",
    color: "from-pink-500 to-pink-600",
  },
  {
    id: "netflix",
    name: "Netflix",
    url: "https://www.netflix.com",
    description: "Stream movies, TV shows, and originals",
    logo: "🎞️",
    color: "from-red-600 to-red-700",
  },
  {
    id: "prime-video",
    name: "Prime Video",
    url: "https://www.primevideo.com",
    description: "Amazon's streaming service",
    logo: "📺",
    color: "from-blue-600 to-blue-700",
  },
  {
    id: "disney-plus",
    name: "Disney+",
    url: "https://www.disneyplus.com",
    description: "Disney, Pixar, Marvel, Star Wars & more",
    logo: "✨",
    color: "from-indigo-500 to-indigo-600",
  },
]

export function VideosContent() {
  const handleOpenService = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Streaming Services</h2>
          <p className="text-muted-foreground">Browse your favorite video platforms</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videoServices.map((service) => (
            <Card
              key={service.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleOpenService(service.url)}
            >
              <div className={`h-24 bg-gradient-to-br ${service.color} flex items-center justify-center relative`}>
                <span className="text-6xl">{service.logo}</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-lg">{service.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenService(service.url)
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
                    handleOpenService(service.url)
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Open {service.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-lg bg-muted/50 border border-border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            <span>About External Links</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            These links will open in a new tab. You may need to sign in to access content on subscription services.
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}
