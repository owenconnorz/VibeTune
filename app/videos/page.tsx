"use client"

import { useState, useEffect } from "react"
import { Play, Eye, Calendar, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useRouter } from "next/navigation"

interface VideoItem {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  views: string
  publishedAt: string
  url: string
  isVideo: boolean
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { playTrack, setVideoMode } = useAudioPlayer()
  const router = useRouter()

  const categories = [
    { id: "all", label: "All Videos" },
    { id: "music", label: "Music Videos" },
    { id: "live", label: "Live Performances" },
    { id: "trending", label: "Trending" },
  ]

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/youtube-music/search?type=video&limit=20")
      if (response.ok) {
        const data = await response.json()
        const videoItems: VideoItem[] =
          data.items?.map((item: any) => ({
            id: item.id?.videoId || item.id,
            title: item.snippet?.title || "Unknown Title",
            artist: item.snippet?.channelTitle || "Unknown Artist",
            thumbnail:
              item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "/placeholder.svg",
            duration: item.contentDetails?.duration || "0:00",
            views: item.statistics?.viewCount
              ? `${Math.floor(Number.parseInt(item.statistics.viewCount) / 1000)}K views`
              : "Unknown views",
            publishedAt: item.snippet?.publishedAt
              ? new Date(item.snippet.publishedAt).toLocaleDateString()
              : "Unknown date",
            url: `https://www.youtube.com/watch?v=${item.id?.videoId || item.id}`,
            isVideo: true,
          })) || []
        setVideos(videoItems)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayVideo = (video: VideoItem) => {
    // Enable video mode and play the track
    setVideoMode(true)
    playTrack({
      id: video.id,
      title: video.title,
      artist: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      url: video.url,
      isVideo: true,
    })
  }

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "music" && video.title.toLowerCase().includes("music")) ||
      (selectedCategory === "live" && video.title.toLowerCase().includes("live")) ||
      (selectedCategory === "trending" && true) // For now, all videos are considered trending
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/80">Loading videos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Music Videos</h1>
          <p className="text-white/70">Discover and watch the latest music videos</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedCategory === category.id
                    ? "bg-purple-600 text-white"
                    : "border-white/20 text-white/70 hover:bg-white/10"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer"
              onClick={() => handlePlayVideo(video)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "/music-video-thumbnail.png"
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold line-clamp-2 mb-2 group-hover:text-purple-300 transition-colors">
                  {video.title}
                </h3>
                <p className="text-white/70 text-sm mb-3 truncate">{video.artist}</p>

                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{video.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{video.publishedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredVideos.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-white/50 mb-4">
              <Play className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No videos found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
