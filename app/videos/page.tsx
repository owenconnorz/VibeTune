"use client"

import { useState, useEffect } from "react"
import { Search, Play, Clock, Eye, Plus, ThumbsUp, ThumbsDown, Heart, Share, Flag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AudioPlayer } from "@/components/audio-player"
import { VideoPlayer } from "@/components/video-player"

interface Video {
  id: string
  title: string
  keywords: string
  views: number
  rate: number
  url: string
  added: string
  length_min: string
  thumb: string
  default_thumb: {
    src: string
    width: number
    height: number
  }
}

interface ApiResponse {
  total_count: number
  count: number
  videos: Video[]
  error?: string
}

export default function VideosPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string; videos: Video[] }>>([])
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  useEffect(() => {
    const savedPlaylists = localStorage.getItem("videoPlaylists")
    if (savedPlaylists) {
      setPlaylists(JSON.parse(savedPlaylists))
    }

    setHasInitialLoad(true)
    fetchVideos("popular")
  }, [])

  const fetchVideos = async (query: string, page = 1) => {
    setIsLoading(true)
    console.log("[v0] Fetching videos:", { query, page })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`/api/eporner/search?query=${encodeURIComponent(query)}&page=${page}&per_page=12`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const data: ApiResponse = await response.json()

      if (data.error) {
        console.error("[v0] API error:", data.error)
        setVideos([])
        setTotalCount(0)
      } else {
        setVideos(page === 1 ? data.videos : [...videos, ...data.videos])
        setTotalCount(data.total_count)
        setCurrentPage(page)
        console.log("[v0] Videos loaded:", data.videos.length)
      }
    } catch (error) {
      console.error("[v0] Fetch error:", error)
      setVideos([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentPage(1)
      fetchVideos(searchQuery.trim())
    }
  }

  const loadMore = () => {
    if (!isLoading && videos.length < totalCount) {
      fetchVideos(searchQuery || "popular", currentPage + 1)
    }
  }

  const formatDuration = (minutes: string) => {
    const mins = Number.parseInt(minutes)
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return hours > 0 ? `${hours}:${remainingMins.toString().padStart(2, "0")}` : `${mins}:00`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleClosePlayer = () => {
    setSelectedVideo(null)
  }

  const handleAddToPlaylist = (video: Video) => {
    const playlistName = prompt("Enter playlist name (or leave empty for 'My Videos'):")
    const finalPlaylistName = playlistName?.trim() || "My Videos"

    setPlaylists((prev) => {
      const existingPlaylist = prev.find((p) => p.name === finalPlaylistName)
      let updatedPlaylists

      if (existingPlaylist) {
        if (!existingPlaylist.videos.some((v) => v.id === video.id)) {
          updatedPlaylists = prev.map((p) =>
            p.name === finalPlaylistName ? { ...p, videos: [...p.videos, video] } : p,
          )
        } else {
          alert("Video already in playlist!")
          return prev
        }
      } else {
        updatedPlaylists = [
          ...prev,
          {
            id: Date.now().toString(),
            name: finalPlaylistName,
            videos: [video],
          },
        ]
      }

      localStorage.setItem("videoPlaylists", JSON.stringify(updatedPlaylists))
      alert(`Added "${video.title}" to "${finalPlaylistName}"`)
      return updatedPlaylists
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black border-b border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center"></div>
          <div className="flex items-center gap-4">
            <Search className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
            <User className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
          </div>
        </div>

        <div className="flex gap-6 mb-4 overflow-x-auto">
          <button className="text-orange-500 font-semibold whitespace-nowrap border-b-2 border-orange-500 pb-2">
            VIDEOS
          </button>
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">LIVE CAMS</button>
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">CATEGORIES</button>
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">MODELS</button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-gray-900 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-700"
              placeholder="Search videos..."
            />
          </div>
          <Button onClick={handleSearch} className="bg-orange-500 text-white hover:bg-orange-600 px-6 py-3">
            Search
          </Button>
        </div>
      </div>

      <div className="p-4 pb-20">
        {isLoading && !hasInitialLoad ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-gray-400">Loading videos...</p>
            </div>
          </div>
        ) : (
          <>
            {totalCount > 0 && (
              <div className="mb-6">
                <p className="text-gray-400 text-sm">Found {totalCount.toLocaleString()} videos</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors group"
                >
                  <div className="relative aspect-video">
                    <img
                      src={video.default_thumb.src || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div
                      className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="bg-white bg-opacity-20 rounded-full p-4">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.length_min)}
                    </div>
                    <div className="absolute top-2 left-2 bg-orange-500 text-black text-xs px-2 py-1 rounded font-bold">
                      HD
                    </div>
                  </div>

                  <div className="p-4">
                    <h3
                      className="font-medium text-base line-clamp-2 mb-3 hover:text-orange-500 cursor-pointer"
                      title={video.title}
                    >
                      {video.title}
                    </h3>

                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{formatViews(video.views)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{video.added}</span>
                        </div>
                      </div>
                      <div className="text-orange-500 font-medium">
                        ★ {typeof video.rate === "number" ? video.rate.toFixed(1) : "N/A"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1 text-gray-400 hover:text-white text-sm">
                          <ThumbsUp className="w-4 h-4" />
                          <span>46</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-white text-sm">
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-orange-500">
                          <Heart className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-white">
                          <Share className="w-4 h-4" />
                        </button>
                      </div>
                      <button className="text-gray-400 hover:text-white">
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>

                    <Button
                      onClick={() => handleAddToPlaylist(video)}
                      size="sm"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Playlist
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {videos.length < totalCount && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-3"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}

            {videos.length === 0 && hasInitialLoad && !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-400">No videos found. Try a different search term.</p>
              </div>
            )}
          </>
        )}
      </div>

      <VideoPlayer video={selectedVideo} onClose={handleClosePlayer} onAddToPlaylist={handleAddToPlaylist} />

      <AudioPlayer />

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center justify-around py-1">
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-5 h-5 text-gray-400 mb-0.5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400">Home</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={() => router.push("/explore")}>
            <div className="w-5 h-5 text-gray-400 mb-0.5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400">Explore</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3">
            <div className="bg-orange-500 rounded-full p-1.5 mb-0.5">
              <div className="w-4 h-4 text-white flex items-center justify-center">
                <Play className="w-3 h-3" />
              </div>
            </div>
            <span className="text-[10px] text-white font-medium">Porn</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={() => router.push("/library")}>
            <div className="w-5 h-5 text-gray-400 mb-0.5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400">Library</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
