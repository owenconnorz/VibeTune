"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Play, Heart, Download, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useLikedSongs } from "@/contexts/liked-songs-context"
import { usePlaylist } from "@/contexts/playlist-context"
import { useDownloads } from "@/contexts/download-context"
import { AudioPlayer } from "@/components/audio-player"
import { videoPluginManager } from "@/lib/video-plugins/plugin-manager"
import { EpornerPlugin } from "@/lib/video-plugins/eporner-plugin"
import type { VideoSource, SearchResult } from "@/lib/video-plugins/plugin-interface"

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoSource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("2") // Default to keyword search
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableSearchTypes, setAvailableSearchTypes] = useState([{ value: "2", label: "Search Videos" }])

  const { playTrack } = useAudioPlayer()
  const { isLiked, toggleLike } = useLikedSongs()
  const { addToDownloads } = useDownloads()
  const { addToPlaylist } = usePlaylist()

  useEffect(() => {
    const initializePlugins = async () => {
      // Register default plugins
      const epornerPlugin = new EpornerPlugin()
      videoPluginManager.registerPlugin(epornerPlugin)

      // Initialize all plugins
      await videoPluginManager.initializeAll()

      // Update available search types from enabled plugins
      const enabledPlugins = videoPluginManager.getEnabledPlugins()
      if (enabledPlugins.length > 0) {
        setAvailableSearchTypes(enabledPlugins[0].supportedSearchTypes)
      }

      // Load initial videos
      fetchVideos("", searchType, 1)
    }

    initializePlugins()
  }, [])

  const fetchVideos = async (query = "", type = "2", page = 1) => {
    setLoading(true)
    setError(null)

    try {
      console.log(`[v0] Fetching videos via plugin system: query="${query}", type="${type}", page=${page}`)

      const result: SearchResult = await videoPluginManager.searchAll({
        query,
        type,
        page,
        perPage: 20,
      })

      if (result.error) {
        setError(result.error)
        setVideos([])
      } else {
        setVideos(page === 1 ? result.videos : [...videos, ...result.videos])
        setHasNextPage(result.hasNextPage)
      }
    } catch (err) {
      console.error("[v0] Error fetching videos via plugins:", err)
      setError("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }

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

  const handleVideoClick = (video: VideoSource) => {
    const track = {
      id: `${video.source}_${video.id}`,
      title: video.title,
      artist: "Adult Video",
      thumbnail: video.thumbnail,
      duration: video.duration,
      videoUrl: video.embed || video.url,
      isVideo: true,
      source: video.source,
    }

    console.log("[v0] Playing video from plugin:", track.title, "source:", video.source)
    playTrack(track)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleLike = (video: VideoSource) => {
    const track = {
      id: `${video.source}_${video.id}`,
      title: video.title,
      artist: "Adult Video",
      thumbnail: video.thumbnail,
      duration: video.duration,
    }
    toggleLike(track)
  }

  const handleDownload = (video: VideoSource) => {
    const track = {
      id: `${video.source}_${video.id}`,
      title: video.title,
      artist: "Adult Video",
      thumbnail: video.thumbnail,
      duration: video.duration,
      audioUrl: video.url,
    }
    addToDownloads(track)
  }

  const convertVideoToSong = (video: VideoSource) => ({
    id: `${video.source}_${video.id}`,
    title: video.title,
    artist: "Adult Video",
    thumbnail: video.thumbnail,
    duration: video.duration,
    videoUrl: video.embed || video.url,
    isVideo: true,
  })

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Adult Videos</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Settings className="w-4 h-4" />
              <span>{videoPluginManager.getEnabledPlugins().length} plugins active</span>
            </div>
          </div>

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
                {availableSearchTypes.map((type) => (
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
                <div key={`${video.source}_${video.id}`} className="bg-zinc-800 rounded-lg overflow-hidden group">
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
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
                      {video.duration}m
                    </div>
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.source}
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">{video.title}</h3>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                      <span>{video.views.toLocaleString()} views</span>
                      <span>★ {video.rating.toFixed(1)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleLike(video)}
                        size="sm"
                        variant="ghost"
                        className={`p-1 h-8 w-8 ${isLiked(`${video.source}_${video.id}`) ? "text-red-500" : "text-zinc-400"}`}
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
