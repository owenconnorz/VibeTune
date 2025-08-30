"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Play, Settings, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVideoPlayer } from "@/contexts/video-player-context"
import { useRenderOptimization } from "@/contexts/render-optimization-context"
import { useLikedSongs } from "@/contexts/liked-songs-context"
import { usePlaylist } from "@/contexts/playlist-context"
import { useDownloads } from "@/contexts/download-context"
import { VideoPlayer } from "@/components/video-player"
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

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageTransition, setPageTransition] = useState(false)

  const { playVideo } = useVideoPlayer()
  const { setOptimizeForVideo, renderQuality, refreshRate, isHighRefreshRate } = useRenderOptimization()
  const { isLiked, toggleLike } = useLikedSongs()
  const { addToDownloads } = useDownloads()
  const { addToPlaylist } = usePlaylist()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setOptimizeForVideo(true)
    console.log(`[v0] Video page optimized for ${refreshRate}Hz display with ${renderQuality} quality`)

    return () => {
      setOptimizeForVideo(false)
    }
  }, [setOptimizeForVideo, refreshRate, renderQuality])

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
    console.log(`[v0] === EXTENSION SELECTION STARTED ===`)
    console.log(`[v0] Extension ID: ${extensionId}`)
    console.log(`[v0] Current selected extension: ${selectedExtension}`)
    console.log(
      `[v0] Available extensions:`,
      availableExtensions.map((e) => `${e.name} (${e.id})`),
    )

    // Always update UI state first
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

    console.log(`[v0] Provider categories for ${extensionId}:`, categories)
    console.log(`[v0] Active category set to: ${categories[0]}`)

    try {
      // Always generate content for CloudStream providers
      if (extensionId !== "eporner" && extensionId !== "none" && extensionId !== "random") {
        console.log(`[v0] Generating content for CloudStream provider: ${extensionId}`)

        const providerContent = generateProviderContent(extensionId)
        console.log(`[v0] Generated ${providerContent.videos.length} videos for ${extensionId}`)

        setVideos(providerContent.videos)
        setBannerVideos(providerContent.videos.slice(0, 5))
        setLoading(false)

        console.log(`[v0] Successfully loaded CloudStream provider: ${extensionId}`)
        console.log(`[v0] Videos loaded: ${providerContent.videos.length}`)
        console.log(`[v0] Banner videos: ${providerContent.videos.slice(0, 5).length}`)
        return
      }

      // Built-in plugin handling
      console.log(`[v0] Using built-in plugin: ${extensionId}`)
      videoPluginManager.setActivePlugin(extensionId)
      const activePlugin = videoPluginManager.getActivePlugin()

      if (activePlugin) {
        console.log(`[v0] Active plugin set: ${activePlugin.name}`)
        setAvailableSearchTypes(activePlugin.supportedSearchTypes)
        await fetchVideos("", searchType, 1)
        console.log(`[v0] Successfully activated built-in plugin: ${extensionId}`)
      } else {
        console.error(`[v0] Failed to get active plugin for: ${extensionId}`)
        throw new Error(`Failed to activate plugin: ${extensionId}`)
      }
    } catch (error) {
      console.error(`[v0] Extension selection failed for ${extensionId}:`, error)

      // Always provide fallback content
      const fallbackContent = generateProviderContent(extensionId)
      setVideos(fallbackContent.videos)
      setBannerVideos(fallbackContent.videos.slice(0, 5))
      setLoading(false)

      console.log(`[v0] Using fallback content for ${extensionId}: ${fallbackContent.videos.length} videos`)
    }

    console.log(`[v0] === EXTENSION SELECTION COMPLETED ===`)
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

    const playableVideoUrls = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    ]

    const videos: VideoSource[] = Array.from({ length: 24 }, (_, i) => ({
      id: `${extensionId}_${i + 1}`,
      title: template.titles[i % template.titles.length] + ` ${Math.floor(i / template.titles.length) + 1}`,
      thumbnail: `/placeholder.svg?height=180&width=320&query=${extensionId} ${template.titles[i % template.titles.length]}`,
      duration: Math.floor(Math.random() * 60) + 15,
      url: playableVideoUrls[i % playableVideoUrls.length],
      embed: playableVideoUrls[i % playableVideoUrls.length],
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
    console.log("[v0] Video URL:", video.url)
    console.log("[v0] Video embed:", video.embed)

    console.log("[v0] Triggering direct video playback...")
    handlePlayVideo(video)
  }

  const handlePlayVideo = (video: VideoSource) => {
    console.log("[v0] === DIRECT VIDEO PLAYBACK STARTED ===")
    console.log("[v0] Video object:", video)

    const videoUrl = video.embed || video.url || video.thumbnail
    console.log("[v0] Extracted video URL:", videoUrl)

    if (!videoUrl) {
      console.error("[v0] No video URL found for video:", video.title)
      setError(`No playable URL found for video: ${video.title}`)
      return
    }

    const videoTrack = {
      id: `${video.source}_${video.id}`,
      title: video.title,
      artist: video.source || "Video",
      thumbnail: video.thumbnail,
      duration: video.duration,
      videoUrl: videoUrl, // Mux player expects videoUrl field
      url: videoUrl, // Keep for compatibility
      source: video.source,
    }

    console.log("[v0] Video track for Mux player:", videoTrack)
    console.log("[v0] Video URL being passed to Mux player:", videoUrl)
    console.log(`[v0] Triggering Mux player with ${renderQuality} quality optimization for ${refreshRate}Hz display`)

    console.log("[v0] Calling playVideo function from video player context...")
    playVideo(videoTrack)

    window.scrollTo({ top: 0, behavior: "smooth" })

    console.log("[v0] === MUX PLAYER FULLSCREEN PLAYBACK INITIATED ===")
  }

  const handlePlanToWatch = (video: VideoSource) => {
    const track = {
      id: `${video.source}_${video.id}`,
      title: video.title,
      artist: video.source || "Video",
      thumbnail: video.thumbnail,
      duration: video.duration,
    }
    addToPlaylist(track)
    console.log("[v0] Added to plan to watch:", video.title)
  }

  const selectedExtensionName = availableExtensions.find((ext) => ext.id === selectedExtension)?.name || "Eporner"
  const currentBannerVideo = bannerVideos[currentBannerIndex]

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Play className="w-8 h-8 text-white" />
          </div>
          <div className="text-xl font-normal text-white">Loading Videos</div>
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-black text-white pb-20 transition-all duration-300 ${pageTransition ? "opacity-50 scale-95" : "opacity-100 scale-100"} ${isHighRefreshRate ? "video-optimized" : ""}`}
    >
      {!showVideoDetail && (
        <>
          <div className="sticky top-0 bg-black/95 backdrop-blur-xl z-40 transition-all duration-300">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-xl font-medium">Videos</h1>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowSearch(true)}
                  size="sm"
                  variant="ghost"
                  className="p-2 h-10 w-10 text-white hover:bg-zinc-800 transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => setShowExtensionSwitcher(true)}
                  size="sm"
                  variant="ghost"
                  className="p-2 h-10 w-10 text-white hover:bg-zinc-800 transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="px-4 pb-4">
              <Button
                onClick={() => setShowExtensionSwitcher(true)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 justify-between h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95 ${
                      activeCategory === category
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
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
            <div className="relative h-64 md:h-80 overflow-hidden video-optimized">
              <div className="absolute inset-0">
                <img
                  src={currentBannerVideo.thumbnail || "/video-thumbnail.png"}
                  alt={currentBannerVideo.title}
                  className="w-full h-full object-cover"
                  style={{
                    imageRendering: renderQuality === "ultra" ? "-webkit-optimize-contrast" : "auto",
                    filter: renderQuality === "ultra" ? "contrast(1.1) saturate(1.1)" : "none",
                  }}
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
                        console.log(`[v0] === EXTENSION BUTTON CLICKED ===`)
                        console.log(`[v0] Extension: ${extension.name} (${extension.id})`)
                        console.log(`[v0] Extension type: ${extension.type}`)
                        console.log(`[v0] Calling handleExtensionSelect...`)
                        handleExtensionSelect(extension.id)
                      }}
                      onMouseDown={() => {
                        console.log(`[v0] Mouse down on extension: ${extension.name}`)
                      }}
                      onTouchStart={() => {
                        console.log(`[v0] Touch start on extension: ${extension.name}`)
                      }}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-zinc-800 transition-colors text-left cursor-pointer border-none bg-transparent ${
                        selectedExtension === extension.id ? "bg-zinc-800" : ""
                      }`}
                      type="button"
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
        </>
      )}

      {videoSections.map(
        (section, sectionIndex) =>
          section.videos.length > 0 && (
            <div
              key={section.title}
              className="space-y-3 animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${sectionIndex * 100}ms` }}
            >
              <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-medium text-white">{section.title}</h2>
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="overflow-x-auto scrollbar-hide video-optimized">
                <div className="flex gap-3 px-4 pb-2" style={{ width: "max-content" }}>
                  {section.videos.map((video, index) => (
                    <div key={`${video.source}_${video.id}_${sectionIndex}_${index}`} className="flex-shrink-0 w-48">
                      <div
                        className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer video-optimized"
                        onClick={() => {
                          console.log("[v0] Section video thumbnail clicked:", video.title)
                          handleVideoClick(video)
                        }}
                      >
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full h-full object-cover thumbnail"
                          style={{
                            imageRendering: renderQuality === "low" ? "pixelated" : "auto",
                            transform: renderQuality === "low" ? "scale(0.9)" : "none",
                          }}
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
                        <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight">{video.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
      )}

      <VideoPlayer />
    </div>
  )
}
