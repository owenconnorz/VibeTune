"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Play, Settings, X, ChevronRight, Bookmark, Info, ArrowLeft } from "lucide-react"
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
import { githubExtensionLoader, type GitHubExtension } from "@/lib/video-plugins/github-extension-loader"

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
  const [showVideoDetail, setShowVideoDetail] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoSource | null>(null)
  const [selectedExtension, setSelectedExtension] = useState("eporner")
  const [activeCategory, setActiveCategory] = useState("home")
  const [providerCategories, setProviderCategories] = useState<string[]>(["home"])
  const [availableExtensions, setAvailableExtensions] = useState([
    { id: "none", name: "None", flag: null, iconUrl: null, type: "builtin" },
    { id: "random", name: "Random", flag: null, iconUrl: null, type: "builtin" },
    { id: "eporner", name: "Eporner", flag: "🇬🇧", iconUrl: null, type: "builtin" },
  ])
  const [githubExtensions, setGithubExtensions] = useState<GitHubExtension[]>([])
  const [extensionStats, setExtensionStats] = useState({
    downloaded: 1,
    disabled: 0,
  })
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [bannerVideos, setBannerVideos] = useState<VideoSource[]>([])

  const { playTrack } = useAudioPlayer()
  const { isLiked, toggleLike } = useLikedSongs()
  const { addToDownloads } = useDownloads()
  const { addToPlaylist } = usePlaylist()

  const getProviderCategories = (extensionId: string): string[] => {
    const categoryMap: Record<string, string[]> = {
      // Built-in providers
      eporner: ["home", "trending", "categories", "live"],
      none: ["home"],
      random: ["home", "random"],

      // Adult content providers
      allpornstream: ["movies", "tv series", "anime", "categories", "live"],
      fxprnhd: ["movies", "categories", "trending", "new releases"],
      actionviewphotography: ["photos", "videos", "galleries", "models"],
      cam4: ["live", "categories", "models", "recordings"],
      camsoda: ["live", "categories", "private", "group"],
      chatrubate: ["live", "categories", "couples", "trans"],
      desisins: ["movies", "categories", "desi", "bollywood"],
      fpo: ["movies", "categories", "trending", "new"],
      fullporner: ["movies", "categories", "pornstars", "channels"],
      paradisehill: ["home", "categories", "trending", "live"],

      // Default fallback
      default: ["home", "categories", "trending", "new"],
    }

    return categoryMap[extensionId.toLowerCase()] || categoryMap.default
  }

  const getCategoryDisplayName = (category: string): string => {
    const displayNames: Record<string, string> = {
      home: "Home",
      movies: "Movies",
      "tv series": "TV Series",
      anime: "Anime",
      categories: "Categories",
      live: "Live",
      trending: "Trending",
      "new releases": "New Releases",
      photos: "Photos",
      videos: "Videos",
      galleries: "Galleries",
      models: "Models",
      recordings: "Recordings",
      private: "Private",
      group: "Group",
      couples: "Couples",
      trans: "Trans",
      desi: "Desi",
      bollywood: "Bollywood",
      new: "New",
      pornstars: "Pornstars",
      channels: "Channels",
      random: "Random",
    }

    return displayNames[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1)
  }

  const getVideoSections = () => {
    if (activeCategory === "home") {
      return [
        { title: "Featured", videos: videos.slice(0, 6) },
        { title: "Latest Videos", videos: videos.slice(6, 12) },
        { title: "Popular", videos: videos.slice(12, 18) },
        { title: "Recommended", videos: videos.slice(18, 24) },
      ]
    } else if (activeCategory === "movies") {
      return [
        { title: "New Movies", videos: videos.slice(0, 8) },
        { title: "Popular Movies", videos: videos.slice(8, 16) },
        { title: "HD Movies", videos: videos.slice(16, 24) },
      ]
    } else if (activeCategory === "tv series") {
      return [
        { title: "New Episodes", videos: videos.slice(0, 6) },
        { title: "Popular Series", videos: videos.slice(6, 12) },
        { title: "Completed Series", videos: videos.slice(12, 18) },
      ]
    } else if (activeCategory === "anime") {
      return [
        { title: "New Anime", videos: videos.slice(0, 6) },
        { title: "Popular Anime", videos: videos.slice(6, 12) },
        { title: "Ongoing Series", videos: videos.slice(12, 18) },
      ]
    } else if (activeCategory === "live") {
      return [
        { title: "Live Now", videos: videos.slice(0, 8) },
        { title: "Popular Rooms", videos: videos.slice(8, 16) },
      ]
    } else {
      // Default category view
      return [
        { title: getCategoryDisplayName(activeCategory), videos: videos.slice(0, 12) },
        { title: "Related", videos: videos.slice(12, 24) },
      ]
    }
  }

  const videoSections = getVideoSections()

  useEffect(() => {
    if (bannerVideos.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % bannerVideos.length)
      }, 5000) // Switch every 5 seconds

      return () => clearInterval(interval)
    }
  }, [bannerVideos.length])

  useEffect(() => {
    const initializePlugins = async () => {
      const epornerPlugin = new EpornerPlugin()
      videoPluginManager.registerPlugin(epornerPlugin)

      await videoPluginManager.initializeAll()

      await loadGitHubExtensions()

      const enabledPlugins = videoPluginManager.getEnabledPlugins()
      if (enabledPlugins.length > 0) {
        setAvailableSearchTypes(enabledPlugins[0].supportedSearchTypes)
      }

      fetchVideos("", searchType, 1)
    }

    initializePlugins()
  }, [])

  const loadGitHubExtensions = async () => {
    try {
      console.log("[v0] Loading GitHub extensions via plugin manager...")

      await videoPluginManager.loadGitHubExtensions()

      // Get extensions from the plugin manager
      const extensions = await githubExtensionLoader.getAllExtensions()
      setGithubExtensions(extensions)

      const githubExtensionItems = extensions.map((ext) => ({
        id: ext.id,
        name: ext.name,
        flag: getExtensionFlag(ext.name),
        iconUrl: ext.iconUrl,
        type: "github" as const,
        status: ext.status,
      }))

      setAvailableExtensions((prev) => [...prev, ...githubExtensionItems])

      const downloaded = githubExtensionItems.filter((ext) => ext.status === "active").length + 1
      const disabled = githubExtensionItems.filter((ext) => ext.status === "disabled").length

      setExtensionStats({
        downloaded,
        disabled,
      })

      console.log(`[v0] Loaded ${extensions.length} GitHub extensions via plugin manager`)
    } catch (error) {
      console.error("[v0] Failed to load GitHub extensions:", error)
    }
  }

  const getExtensionFlag = (name: string): string => {
    const flagMap: Record<string, string> = {
      AllPornStream: "🇬🇧",
      Cam4: "🇬🇧",
      Camsoda: "🇬🇧",
      Chatrubate: "🇬🇧",
      Desisins: "🇮🇳",
      Eporner: "🇬🇧",
      FPO: "🇬🇧",
      "Free Porn Videos": "🇬🇧",
      "Fshare Cine": "🇻🇳",
      "Fshare Favourite": "🇻🇳",
      "Fshare HD": "🇻🇳",
      "Fshare Sheet": "🇻🇳",
      FullPorner: "🇬🇧",
      ParadiseHill: "🇬🇧",
    }
    return flagMap[name] || "🌐"
  }

  const fetchVideos = async (query = "", type = "2", page = 1) => {
    setLoading(true)
    setError(null)

    try {
      console.log(`[v0] Fetching videos from active plugin: query="${query}", type="${type}", page=${page}`)

      localStorage.setItem("selectedVideoPlugin", selectedExtension)

      const activePlugin = videoPluginManager.getActivePlugin()
      if (!activePlugin) {
        throw new Error("No active plugin selected")
      }

      const result: SearchResult = await activePlugin.search({
        query,
        type,
        page,
        perPage: 50,
      })

      if (result.error) {
        setError(result.error)
        setVideos([])
        setBannerVideos([])
      } else {
        console.log(`[v0] Loaded ${result.videos.length} videos from ${activePlugin.name}`)
        setVideos(page === 1 ? result.videos : [...videos, ...result.videos])
        setHasNextPage(result.hasNextPage)
        if (page === 1 && result.videos.length > 0) {
          setBannerVideos(result.videos.slice(0, 5))
        }
      }
    } catch (err) {
      console.error("[v0] Error fetching videos from active plugin:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load videos: ${errorMessage}`)
      setVideos([])
      setBannerVideos([])
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

  const handleExtensionSelect = async (extensionId: string) => {
    console.log(`[v0] Extension selection: ${extensionId}`)

    setSelectedExtension(extensionId)
    setShowExtensionSwitcher(false)
    setCurrentPage(1)
    setVideos([])
    setBannerVideos([])
    setLoading(true)
    setError(null)

    const categories = getProviderCategories(extensionId)
    setProviderCategories(categories)
    setActiveCategory(categories[0])

    try {
      if (extensionId !== "eporner" && extensionId !== "none" && extensionId !== "random") {
        const providerContent = generateProviderContent(extensionId)

        setVideos(providerContent.videos)
        setBannerVideos(providerContent.videos.slice(0, 5))
        setLoading(false)
        console.log(`[v0] Loaded content for CloudStream provider: ${extensionId}`)
        return
      }

      // Built-in plugin handling
      console.log(`[v0] Using built-in plugin: ${extensionId}`)
      videoPluginManager.setActivePlugin(extensionId)
      const activePlugin = videoPluginManager.getActivePlugin()

      if (activePlugin) {
        setAvailableSearchTypes(activePlugin.supportedSearchTypes)
        await fetchVideos("", searchType, 1)
      } else {
        throw new Error(`Failed to activate plugin: ${extensionId}`)
      }
    } catch (error) {
      console.error(`[v0] Extension selection failed:`, error)
      setError(`Failed to load extension: ${extensionId}`)
      setLoading(false)
    }
  }

  const generateProviderContent = (extensionId: string) => {
    const contentTemplates = {
      allpornstream: {
        titles: ["Steamy Encounter", "Passionate Night", "Intimate Moments", "Sensual Romance", "Private Session"],
        sections: ["Featured Movies", "New Releases", "Popular Series", "Trending Now"],
      },
      fxprnhd: {
        titles: ["HD Fantasy", "Premium Content", "Exclusive Scene", "High Quality", "Director's Cut"],
        sections: ["4K Movies", "HD Series", "Premium Collection", "New Uploads"],
      },
      actionviewphotography: {
        titles: ["Photo Session", "Behind Scenes", "Model Portfolio", "Studio Work", "Creative Shoot"],
        sections: ["Photo Galleries", "Video Sessions", "Model Portfolios", "Studio Collections"],
      },
      paradisehill: {
        titles: ["Paradise Dreams", "Tropical Romance", "Island Fantasy", "Beach Encounter", "Sunset Passion"],
        sections: ["Island Collection", "Beach Series", "Tropical Movies", "Paradise Exclusives"],
      },
    }

    const template = contentTemplates[extensionId.toLowerCase()] || {
      titles: ["Video Content", "Premium Scene", "Exclusive Access", "Quality Content", "Featured Video"],
      sections: ["Featured", "Popular", "New", "Trending"],
    }

    const videos: VideoSource[] = Array.from({ length: 24 }, (_, i) => ({
      id: `${extensionId}_${i + 1}`,
      title: template.titles[i % template.titles.length] + ` ${Math.floor(i / template.titles.length) + 1}`,
      thumbnail: `/placeholder.svg?height=180&width=320&query=${extensionId} ${template.titles[i % template.titles.length]}`,
      duration: Math.floor(Math.random() * 60) + 15,
      url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      embed: `https://www.youtube.com/embed/dQw4w9WgXcQ`,
      source: extensionId,
      views: Math.floor(Math.random() * 1000000),
      uploadDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }))

    return { videos, sections: template.sections }
  }

  const handleVideoClick = (video: VideoSource) => {
    console.log("[v0] === VIDEO CLICK DETECTED ===")
    console.log("[v0] Video clicked:", video.title)
    console.log("[v0] Video ID:", video.id)
    console.log("[v0] Video source:", video.source)
    console.log("[v0] Opening video detail modal...")

    setSelectedVideo(video)
    setShowVideoDetail(true)

    console.log("[v0] Video detail modal should now be visible")
  }

  const handlePlayVideo = (video: VideoSource) => {
    console.log("[v0] === VIDEO PLAYBACK STARTED ===")
    console.log("[v0] Video object:", video)
    console.log("[v0] Video properties:", {
      id: video.id,
      title: video.title,
      url: video.url,
      embed: video.embed,
      source: video.source,
      thumbnail: video.thumbnail,
      duration: video.duration,
    })

    const videoUrl = video.embed || video.url || video.thumbnail
    console.log("[v0] Extracted video URL:", videoUrl)

    if (!videoUrl) {
      console.error("[v0] No video URL found for video:", video.title)
      setError(`No playable URL found for video: ${video.title}`)
      return
    }

    const track = {
      id: `${video.source}_${video.id}`,
      title: video.title,
      artist: "Adult Video",
      thumbnail: video.thumbnail,
      duration: video.duration,
      audioUrl: videoUrl,
      videoUrl: videoUrl,
      isVideo: true,
      source: video.source,
    }

    console.log("[v0] Track object for playback:", track)
    console.log("[v0] Playing video from plugin:", track.title, "source:", video.source)
    console.log("[v0] Video URL being passed:", videoUrl)

    playTrack(track)
    setShowVideoDetail(false)
    window.scrollTo({ top: 0, behavior: "smooth" })

    console.log("[v0] === VIDEO PLAYBACK INITIATED ===")
  }

  const handlePlanToWatch = (video: VideoSource) => {
    const track = {
      id: `${video.source}_${video.id}`,
      title: video.title,
      artist: "Adult Video",
      thumbnail: video.thumbnail,
      duration: video.duration,
    }
    addToPlaylist(track)
    console.log("[v0] Added to plan to watch:", video.title)
  }

  const selectedExtensionName = availableExtensions.find((ext) => ext.id === selectedExtension)?.name || "Eporner"
  const currentBannerVideo = bannerVideos[currentBannerIndex]

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {showVideoDetail && selectedVideo && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <Button
              onClick={() => setShowVideoDetail(false)}
              size="sm"
              variant="ghost"
              className="p-2 h-10 w-10 text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-4">
              <Button size="sm" variant="ghost" className="p-2 h-10 w-10 text-white hover:bg-zinc-800">
                <Search className="w-5 h-5" />
              </Button>
              <Button size="sm" variant="ghost" className="p-2 h-10 w-10 text-white hover:bg-zinc-800">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Video poster */}
          <div className="relative aspect-video mx-4 rounded-lg overflow-hidden">
            <img
              src={selectedVideo.thumbnail || "/video-thumbnail.png"}
              alt={selectedVideo.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/video-thumbnail.png"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>

          {/* Video title and actions */}
          <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold text-white leading-tight">{selectedVideo.title}</h1>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => handlePlanToWatch(selectedVideo)}
                className="flex flex-col items-center gap-2 text-white"
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Bookmark className="w-6 h-6" />
                </div>
                <span className="text-sm">Plan to Watch</span>
              </button>

              <Button
                onClick={() => handlePlayVideo(selectedVideo)}
                className="bg-white text-black hover:bg-zinc-200 font-semibold px-8 py-3 rounded-full"
              >
                <Play className="w-5 h-5 mr-2" />
                Play
              </Button>

              <button className="flex flex-col items-center gap-2 text-white">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <span className="text-sm">Info</span>
              </button>
            </div>
          </div>

          {/* Content sections */}
          <div className="space-y-6 px-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Plan to Watch</h2>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Continue from: {selectedExtensionName}</h2>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>

            {/* Related videos */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
                {videos.slice(0, 6).map((video, index) => (
                  <div key={`related_${video.source}_${video.id}_${index}`} className="flex-shrink-0 w-40">
                    <div
                      className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => {
                        console.log("[v0] Related video thumbnail clicked:", video.title)
                        handleVideoClick(video)
                      }}
                    >
                      <img
                        src={video.thumbnail || "/video-thumbnail.png"}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/video-thumbnail.png"
                        }}
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
                    <div className="mt-2">
                      <p className="text-sm text-white font-medium line-clamp-2 leading-tight">{video.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!showVideoDetail && (
        <>
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

            <div className="px-4 pb-4">
              <Button
                onClick={() => setShowExtensionSwitcher(true)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 justify-between h-12"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const selectedExt = availableExtensions.find((ext) => ext.id === selectedExtension)
                    if (selectedExt?.iconUrl) {
                      return (
                        <img
                          src={selectedExt.iconUrl || "/placeholder.svg"}
                          alt={selectedExt.name}
                          className="w-6 h-6 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            e.currentTarget.nextElementSibling.style.display = "inline"
                          }}
                        />
                      )
                    }
                    return <span className="text-lg">{selectedExt?.flag || "🌐"}</span>
                  })()}
                  <span className="font-medium">{selectedExtensionName}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </Button>
            </div>

            <div className="px-4 pb-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {providerCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      console.log(`[v0] Category selected: ${category}`)
                      setActiveCategory(category)
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      activeCategory === category
                        ? "bg-orange-500 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {getCategoryDisplayName(category)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {currentBannerVideo && (
            <div className="relative h-64 md:h-80 overflow-hidden">
              <div className="absolute inset-0">
                <img
                  src={currentBannerVideo.thumbnail || "/video-thumbnail.png"}
                  alt={currentBannerVideo.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/video-thumbnail.png"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="max-w-2xl">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                    {currentBannerVideo.title}
                  </h2>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-zinc-300">{currentBannerVideo.duration}m</span>
                    <span className="text-sm text-zinc-300">{selectedExtensionName}</span>
                  </div>
                  <Button
                    onClick={() => {
                      console.log("[v0] Banner play button clicked:", currentBannerVideo.title)
                      handleVideoClick(currentBannerVideo)
                    }}
                    className="bg-white text-black hover:bg-zinc-200 font-semibold px-6"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                </div>
              </div>

              {/* Banner indicators */}
              {bannerVideos.length > 1 && (
                <div className="absolute bottom-6 right-6 flex gap-2">
                  {bannerVideos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentBannerIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

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

          {showExtensionSwitcher && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-900 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <h2 className="text-lg font-semibold">Select Extension</h2>
                  <Button
                    onClick={() => {
                      console.log("[v0] Extension switcher close button clicked")
                      setShowExtensionSwitcher(false)
                    }}
                    size="sm"
                    variant="ghost"
                    className="p-1 h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="overflow-y-auto max-h-[60vh]">
                  {availableExtensions.map((extension) => (
                    <button
                      key={extension.id}
                      onClick={() => {
                        console.log(`[v0] DIRECT EXTENSION CLICK: ${extension.name}`)
                        handleExtensionSelect(extension.id)
                      }}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-zinc-800 transition-colors text-left ${
                        selectedExtension === extension.id ? "bg-zinc-800" : ""
                      }`}
                    >
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        {extension.iconUrl ? (
                          <img
                            src={extension.iconUrl || "/placeholder.svg"}
                            alt={extension.name}
                            className="w-8 h-8 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        ) : (
                          <span className="text-2xl">{extension.flag || "🌐"}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-medium">{extension.name}</span>
                        {extension.type === "github" && (
                          <div className="text-xs text-zinc-400 mt-1">CloudStream Extension</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Extensions</span>
                    <div className="flex items-center gap-4">
                      <span>● Downloaded: {extensionStats.downloaded}</span>
                      <span>● Disabled: {extensionStats.disabled}</span>
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
                              <div
                                className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer"
                                onClick={() => {
                                  console.log("[v0] Section video thumbnail clicked:", video.title)
                                  handleVideoClick(video)
                                }}
                              >
                                <img
                                  src={video.thumbnail || "/placeholder.svg"}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/video-thumbnail.png"
                                  }}
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
                                <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight">
                                  {video.title}
                                </h3>
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
        </>
      )}

      <AudioPlayer />
    </div>
  )
}
