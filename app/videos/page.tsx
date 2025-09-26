"use client"

import { useState, useEffect } from "react"
import { Play, Eye, Calendar, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAudioPlayer } from "@/contexts/audio-player-context"

interface EpornerVideo {
  id: string
  title: string
  url: string
  videoUrl?: string
  embed?: string
  thumb: string
  default_thumb: {
    src: string
    width: number
    height: number
  }
  length_min: string
  length_sec?: number
  views: number
  rate: number
  added: string
  keywords: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<EpornerVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("home")
  const [currentPage, setCurrentPage] = useState(1)
  const { playTrack, setVideoMode } = useAudioPlayer()

  const categories = [
    { id: "home", label: "Home", searchType: "5" },
    { id: "trending", label: "Trending", searchType: "6" },
    { id: "latest", label: "Latest", searchType: "2" },
    { id: "longest", label: "Longest", searchType: "3" },
  ]

  useEffect(() => {
    fetchVideos()
  }, [selectedCategory, currentPage])

  const fetchVideos = async (query?: string) => {
    try {
      setLoading(true)
      const category = categories.find((c) => c.id === selectedCategory)
      const searchType = category?.searchType || "5"

      let apiUrl = `/api/eporner/search?searchType=${searchType}&page=${currentPage}&per_page=20`

      if (query || searchQuery) {
        apiUrl += `&query=${encodeURIComponent(query || searchQuery)}`
      }

      if (selectedCategory === "longest") {
        apiUrl += "&duration=longest"
      }

      console.log("[v0] Fetching Eporner videos:", apiUrl)
      const response = await fetch(apiUrl)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Eporner API response:", data)
        setVideos(data.videos || [])
      } else {
        console.error("[v0] Eporner API error:", response.status)
        setVideos([])
      }
    } catch (error) {
      console.error("[v0] Error fetching Eporner videos:", error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    setSelectedCategory("latest") // Switch to search mode
    fetchVideos(searchQuery)
  }

  const handlePlayVideo = (video: EpornerVideo) => {
    console.log("[v0] Playing Eporner video:", video.title)

    setVideoMode(true)
    playTrack({
      id: video.id,
      title: video.title,
      artist: "Eporner",
      thumbnail: video.thumb || video.default_thumb.src,
      duration: `${video.length_min}:00`,
      url: video.url,
      videoUrl: video.embed || video.url,
      isVideo: true,
    })
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`
    }
    return `${views} views`
  }

  const formatDuration = (lengthMin: string, lengthSec?: number) => {
    if (lengthSec) {
      const minutes = Math.floor(lengthSec / 60)
      const seconds = lengthSec % 60
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
    return `${lengthMin}:00`
  }

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
          <h1 className="text-4xl font-bold text-white mb-2">Videos</h1>
          <p className="text-white/70">Discover and watch the latest videos</p>
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
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Search className="w-4 h-4 mr-2" />
              Search
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
                onClick={() => {
                  setSelectedCategory(category.id)
                  setCurrentPage(1)
                  setSearchQuery("")
                }}
              >
                {category.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer"
              onClick={() => handlePlayVideo(video)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={video.thumb || video.default_thumb.src}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "/video-thumbnail.png"
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.length_min, video.length_sec)}
                </div>
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">HD</div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold line-clamp-2 mb-2 group-hover:text-purple-300 transition-colors">
                  {video.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatViews(video.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⭐ {video.rate.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-white/50">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(video.added).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {videos.length > 0 && (
          <div className="flex justify-center mt-8 gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-white">Page {currentPage}</span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={videos.length < 20}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}

        {/* Empty State */}
        {videos.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-white/50 mb-4">
              <Play className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No videos found</h3>
              <p>Try adjusting your search or category</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
