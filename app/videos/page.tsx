"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Play, Heart, Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useLikedSongs } from "@/contexts/liked-songs-context"
import { usePlaylist } from "@/contexts/playlist-context"
import { AudioPlayer } from "@/components/audio-player"

const { useDownloads: useDownloadsHook } = require("@/contexts/download-context")
const useDownloads = typeof window !== "undefined" ? useDownloadsHook : () => ({ addToDownloads: () => {} })

interface Video {
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
  thumbs?: Array<{
    src: string
    width: number
    height: number
  }>
  length_min: string
  length_sec: number
  views: number
  rate: number
  added: string
  keywords: string
}

interface EpornerResponse {
  total_count: number
  count: number
  videos: Video[]
  searchType?: string
  currentPage?: number
  hasNextPage?: boolean
  error?: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("2") // Default to keyword search
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { playTrack } = useAudioPlayer()
  const { isLiked, toggleLike } = useLikedSongs()
  const downloadsContext = useDownloads()
  const addToDownloads = downloadsContext.addToDownloads || (() => {})
  const { addToPlaylist } = usePlaylist()

  const searchTypes = [
    { value: "2", label: "Search Videos" },
    { value: "5", label: "Latest Videos" },
    { value: "6", label: "Trending Videos" },
    { value: "3", label: "Long Videos" },
    { value: "4", label: "Categories" },
  ]

  const fetchVideos = async (query = "", type = "2", page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        searchType: type,
        page: page.toString(),
        per_page: "20",
      })

      if (query && (type === "2" || type === "1" || type === "4")) {
        params.set("query", query)
      }

      if (type === "3") {
        params.set("duration", "longest")
      }

      const response = await fetch(`/api/eporner/search?${params}`)
      const data: EpornerResponse = await response.json()

      if (data.videos) {
        setVideos(page === 1 ? data.videos : [...videos, ...data.videos])
        setHasNextPage(data.hasNextPage || false)
      } else {
        setError(data.error || "Failed to load videos")
      }
    } catch (err) {
      console.error("Error fetching videos:", err)
      setError("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos("", searchType, 1)
  }, [searchType])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchVideos(searchQuery, searchType, 1)
  }

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchVideos(searchQuery, searchType, nextPage)
  }

  const handleVideoClick = (video: Video) => {
    const track = {
      id: `eporner_${video.id}`,
      title: video.title,
      artist: "Adult Video",
      thumbnail: video.thumb,
      duration: video.length_min,
      videoUrl: video.embed || video.url,
      isVideo: true,
      source: "eporner",
    }

    console.log("[v0] Playing eporner video in media player:", track.title)
    playTrack(track)

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleLike = (video: Video) => {
    const track = {
      id: `eporner_${video.id}`,
      title: video.title,
      artist: "Adult Video",
      thumbnail: video.thumb,
      duration: video.length_min,
    }
    toggleLike(track)
  }

  const handleDownload = (video: Video) => {
    if (!addToDownloads) return

    const track = {
      id: `eporner_${video.id}`,
      title: video.title,
      artist: "Adult Video",
      thumbnail: video.thumb,
      duration: video.length_min,
      audioUrl: video.url,
    }
    addToDownloads(track)
  }

  const convertVideoToSong = (video: Video) => ({
    id: `eporner_${video.id}`,
    title: video.title,
    artist: "Adult Video",
    thumbnail: video.thumb,
    duration: video.length_min,
    videoUrl: video.embed || video.url,
    isVideo: true,
  })

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 z-40">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Adult Videos</h1>

          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {searchTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {loading && videos.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="bg-zinc-800 rounded-lg overflow-hidden group">
                  <div className="relative aspect-video">
                    <img
                      src={video.thumb || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/video-thumbnail.png"
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        onClick={() => handleVideoClick(video)}
                        className="bg-orange-500 hover:bg-orange-600 rounded-full w-12 h-12"
                      >
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.length_min}m
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">{video.title}</h3>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                      <span>{video.views.toLocaleString()} views</span>
                      <span>★ {video.rate.toFixed(1)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleLike(video)}
                        size="sm"
                        variant="ghost"
                        className={`p-1 h-8 w-8 ${isLiked(`eporner_${video.id}`) ? "text-red-500" : "text-zinc-400"}`}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDownload(video)}
                        size="sm"
                        variant="ghost"
                        className="p-1 h-8 w-8 text-zinc-400"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <AddToPlaylistDialog
                        songs={[convertVideoToSong(video)]}
                        navigateToPlaylist={true}
                        trigger={
                          <Button size="sm" variant="ghost" className="p-1 h-8 w-8 text-zinc-400 hover:text-white">
                            <Plus className="w-4 h-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button onClick={handleLoadMore} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <AudioPlayer />
    </div>
  )
}
