"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Play, Settings, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [searchType, setSearchType] = useState("2")
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableSearchTypes, setAvailableSearchTypes] = useState([{ value: "2", label: "Search Videos" }])
  const [showExtensionSwitcher, setShowExtensionSwitcher] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedExtension, setSelectedExtension] = useState("eporner")
  const [availableExtensions] = useState([
    { id: "none", name: "None", flag: null },
    { id: "random", name: "Random", flag: null },
    { id: "allpornstream", name: "AllPornStream", flag: "🇬🇧" },
    { id: "allpornstream2", name: "AllPornStream", flag: "🇬🇧" },
    { id: "cam4", name: "Cam4", flag: "🇬🇧" },
    { id: "camsoda", name: "Camsoda", flag: "🇬🇧" },
    { id: "chatrubate", name: "Chatrubate", flag: "🇬🇧" },
    { id: "desisins", name: "Desisins", flag: "🇮🇳" },
    { id: "eporner", name: "Eporner", flag: "🇬🇧" },
    { id: "fpo", name: "FPO", flag: "🇬🇧" },
    { id: "freepornvideos", name: "Free Porn Videos", flag: "🇬🇧" },
    { id: "fsharecine", name: "Fshare Cine", flag: "🇻🇳" },
    { id: "fsharefavourite", name: "Fshare Favourite", flag: "🇻🇳" },
    { id: "fsharehd", name: "Fshare HD", flag: "🇻🇳" },
    { id: "fsharesheet", name: "Fshare Sheet", flag: "🇻🇳" },
    { id: "fullporner", name: "FullPorner", flag: "🇬🇧" },
  ])

  const { playTrack } = useAudioPlayer()
  const { isLiked, toggleLike } = useLikedSongs()
  const { addToDownloads } = useDownloads()
  const { addToPlaylist } = usePlaylist()

  const videoSections = [
    { title: "Home", videos: videos.slice(0, 6) },
    { title: "Latest Videos 2", videos: videos.slice(6, 12) },
    { title: "Latest 4", videos: videos.slice(12, 18) },
    { title: "Adult Time", videos: videos.slice(18, 24) },
    { title: "Couples", videos: videos.slice(24, 30) },
    { title: "Main Page", videos: videos.slice(30, 36) },
    { title: "Latest Videos", videos: videos.slice(36, 42) },
  ]

  useEffect(() => {
    const initializePlugins = async () => {
      const epornerPlugin = new EpornerPlugin()
      videoPluginManager.registerPlugin(epornerPlugin)

      await videoPluginManager.initializeAll()

      const enabledPlugins = videoPluginManager.getEnabledPlugins()
      if (enabledPlugins.length > 0) {
        setAvailableSearchTypes(enabledPlugins[0].supportedSearchTypes)
      }

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
        perPage: 50, // Increased to populate multiple sections
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
    setShowSearch(false)
  }

  const handleExtensionSelect = (extensionId: string) => {
    setSelectedExtension(extensionId)
    setShowExtensionSwitcher(false)
    setCurrentPage(1)
    fetchVideos(searchQuery, searchType, 1)
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

  const convertVideoToSong = (video: VideoSource) => ({
    id: `${video.source}_${video.id}`,
    title: video.title,
    artist: "Adult Video",
    thumbnail: video.thumbnail,
    duration: video.duration,
    videoUrl: video.embed || video.url,
    isVideo: true,
  })

  const selectedExtensionName = availableExtensions.find((ext) => ext.id === selectedExtension)?.name || "Eporner"

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm z-40">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-medium">Videos</h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowSearch(true)}
              size="sm"
              variant="ghost"
              className="p-2 h-10 w-10 text-white hover:bg-zinc-800"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setShowExtensionSwitcher(true)}
              size="sm"
              variant="ghost"
              className="p-2 h-10 w-10 text-white hover:bg-zinc-800"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center pt-20">
          <div className="bg-zinc-900 rounded-lg w-full max-w-md mx-4 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search Videos</h2>
              <Button onClick={() => setShowSearch(false)} size="sm" variant="ghost" className="p-1 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSearch} className="space-y-3">
              <Input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                autoFocus
              />
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
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 w-full">
                Search
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Extension switcher modal - unchanged */}
      {showExtensionSwitcher && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">Select Extension</h2>
              <Button onClick={() => setShowExtensionSwitcher(false)} size="sm" variant="ghost" className="p-1 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {availableExtensions.map((extension) => (
                <button
                  key={extension.id}
                  onClick={() => handleExtensionSelect(extension.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-zinc-800 transition-colors text-left ${
                    selectedExtension === extension.id ? "bg-zinc-800" : ""
                  }`}
                >
                  <span className="text-2xl w-8 flex-shrink-0">{extension.flag || "🌐"}</span>
                  <span className="text-white font-medium">{extension.name}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800">
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>Extensions</span>
                <div className="flex items-center gap-4">
                  <span>● Downloaded: 1</span>
                  <span>● Disabled: 0</span>
                  <span>● Not downloaded: {availableExtensions.length - 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {loading && videos.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        ) : (
          videoSections.map(
            (section, sectionIndex) =>
              section.videos.length > 0 && (
                <div key={section.title} className="space-y-3">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-medium text-white">{section.title}</h2>
                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 px-4 pb-2" style={{ width: "max-content" }}>
                      {section.videos.map((video, index) => (
                        <div
                          key={`${video.source}_${video.id}_${sectionIndex}_${index}`}
                          className="flex-shrink-0 w-48"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer">
                            <img
                              src={video.thumbnail || "/placeholder.svg"}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/video-thumbnail.png"
                              }}
                              onClick={() => handleVideoClick(video)}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white/20 rounded-full p-2">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {video.duration}m
                            </div>
                          </div>
                          <div className="mt-2 space-y-1">
                            <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight">{video.title}</h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ),
          )
        )}
      </div>

      <AudioPlayer />
    </div>
  )
}
