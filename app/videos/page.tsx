"use client"

import { useState, useEffect } from "react"
import { Search, Play, Eye, Plus, ThumbsUp, Heart, Share, Download, Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AudioPlayer } from "@/components/audio-player"
import { useAudioPlayer } from "@/contexts/audio-player-context"

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
  const { playTrack, setVideoMode } = useAudioPlayer()
  const [videos, setVideos] = useState<Video[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
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
      const timeoutId = setTimeout(() => controller.abort(), 30000) // Increased timeout for scraping

      const response = await fetch(`/api/eporner/search?query=${encodeURIComponent(query)}&page=${page}&per_page=12`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const data: ApiResponse = await response.json()

      if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
        setVideos(page === 1 ? data.videos : [...videos, ...data.videos])
        setTotalCount(data.total_count || data.videos.length)
        setCurrentPage(page)
        console.log("[v0] Videos loaded:", data.videos.length, data.error ? "(fallback data)" : "(live data)")
      } else {
        console.error("[v0] No videos in API response:", data)
        setVideos([])
        setTotalCount(0)
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
    if (isNaN(mins) || mins < 0) {
      return "0:00"
    }
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
    const videoTrack = {
      id: `eporner_${video.id}`,
      title: video.title,
      artist: "Video",
      album: "Porn Videos",
      duration: Number.parseInt(video.length_min) * 60, // Convert minutes to seconds
      audioUrl: "", // No audio URL for videos
      videoUrl: video.url, // Use the video URL for HTML5 player
      thumbnail: video.default_thumb?.src || video.thumb || "/placeholder.svg",
      isVideo: true, // Flag to indicate this is video content
      source: "eporner",
      // Explicitly do NOT set videoId to prevent YouTube player usage
    }

    setVideoMode(true) // Enable video mode
    playTrack(videoTrack) // Play the video in the media player
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

  const handleDownload = async (video: Video) => {
    try {
      const response = await fetch(`/api/eporner/download?videoId=${video.id}&title=${encodeURIComponent(video.title)}`)

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `${video.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Download error:", error)
      alert("Download failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black border-b border-gray-800 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                PORN<span className="text-purple-400 italic">Total</span>
              </h1>
            </div>
          </div>
          <div className="bg-gray-800 rounded-full p-2">
            <Search className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex gap-8 mb-6 overflow-x-auto">
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">HOME</button>
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">CONTENT</button>
          <button className="text-purple-400 font-semibold whitespace-nowrap border-b-2 border-purple-400 pb-2">
            CATEGORIES
          </button>
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">APP</button>
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">AFFILIATE</button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 cursor-pointer">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Random</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 cursor-pointer">
            <span className="text-gray-300">All Time</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <h2 className="text-4xl font-bold text-white mb-8 leading-tight">
          Find Your Next
          <br />
          Obsession
        </h2>
      </div>

      <div className="p-4 pb-20">
        {isLoading && !hasInitialLoad ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-gray-400">Loading videos...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-black rounded-2xl overflow-hidden hover:bg-gray-900 transition-colors group"
                >
                  <div className="relative aspect-video">
                    <img
                      src={
                        video.default_thumb?.src ||
                        video.thumb ||
                        "/placeholder.svg?height=400&width=600&query=video thumbnail" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={video.title}
                      className="w-full h-full object-cover rounded-2xl"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (!target.src.includes("placeholder.svg")) {
                          target.src = "/video-thumbnail.png"
                        }
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="bg-white bg-opacity-20 rounded-full p-6">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white text-sm px-3 py-1 rounded-lg font-medium">
                      {formatDuration(video.length_min)}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3
                      className="font-bold text-xl text-white mb-3 hover:text-purple-400 cursor-pointer leading-tight"
                      title={video.title}
                      onClick={() => handleVideoClick(video)}
                    >
                      {video.title}
                    </h3>

                    <div className="flex items-center gap-6 text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        <span className="text-lg font-medium">{formatViews(video.views)} Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="w-5 h-5" />
                        <span className="text-lg font-medium">92% Up</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-purple-400">
                          <Heart className="w-6 h-6" />
                        </button>
                        <button className="text-gray-400 hover:text-white">
                          <Share className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleDownload(video)}
                          className="text-gray-400 hover:text-green-500"
                          title="Download video"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                      </div>
                      <Button
                        onClick={() => handleAddToPlaylist(video)}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Playlist
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {videos.length < totalCount && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-3 rounded-lg font-medium"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}

            {videos.length === 0 && hasInitialLoad && !isLoading && (
              <div className="text-center py-12">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">
                    Unable to load videos. The service may be temporarily unavailable.
                  </p>
                  <Button
                    onClick={() => fetchVideos("popular")}
                    className="bg-purple-600 text-white hover:bg-purple-700 rounded-lg"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.816a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400">Explore</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3">
            <div className="bg-purple-600 rounded-full p-1.5 mb-0.5">
              <div className="w-4 h-4 text-white flex items-center justify-center">
                <Play className="w-3 h-3" />
              </div>
            </div>
            <span className="text-[10px] text-white font-medium">Videos</span>
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
