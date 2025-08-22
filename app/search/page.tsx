"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, ArrowLeft, MoreVertical, User, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { searchMusicEnhanced } from "@/lib/music-data"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"

interface SearchResult {
  id: string
  title?: string
  name?: string
  artist?: string
  channelTitle?: string
  thumbnail?: string
  duration?: string
  description?: string
  videoCount?: number
  publishedAt?: string
  type: "song" | "artist" | "album" | "playlist"
}

interface CategorizedResults {
  topResult?: SearchResult
  songs: SearchResult[]
  artists: SearchResult[]
  albums: SearchResult[]
  playlists: SearchResult[]
}

export default function SearchPage() {
  const router = useRouter()
  const { playQueue } = useAudioPlayer()
  const [query, setQuery] = useState("")
  const [showInput, setShowInput] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  const {
    items: searchResults,
    loading,
    hasMore,
    reset: resetSearch,
  } = useInfiniteScroll<SearchResult>({
    fetchMore: async (page: number) => {
      if (!query.trim()) {
        return { items: [], hasMore: false }
      }

      console.log("[v0] Fetching search results page:", page, "for query:", query)
      const results = await searchMusicEnhanced(query, page)

      const allResults = [...results.songs, ...results.artists, ...results.albums, ...results.playlists]

      return {
        items: allResults,
        hasMore: allResults.length >= 20, // Assume more results if we got a full page
      }
    },
    enabled: !!query.trim(),
    threshold: 800,
  })

  const categorizedResults = useMemo(() => {
    const songs = searchResults.filter((item) => item.type === "song")
    const artists = searchResults.filter((item) => item.type === "artist")
    const albums = searchResults.filter((item) => item.type === "album")
    const playlists = searchResults.filter((item) => item.type === "playlist")

    return {
      topResult: searchResults[0],
      songs,
      artists,
      albums,
      playlists,
    }
  }, [searchResults])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        setShowInput(false)
        resetSearch()
      } else {
        setShowInput(true)
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [query, resetSearch])

  const handlePlaySong = (song: SearchResult, songList: SearchResult[]) => {
    const tracks = songList
      .filter((s) => s.type === "song")
      .map((s: SearchResult) => ({
        id: s.id,
        title: s.title || s.name || "Unknown Title",
        artist: s.artist || s.channelTitle || "Unknown Artist",
        thumbnail: s.thumbnail,
        duration: s.duration,
      }))
    const startIndex = tracks.findIndex((s) => s.id === song.id)
    playQueue(tracks, Math.max(startIndex, 0))
  }

  const handleItemClick = (item: SearchResult) => {
    switch (item.type) {
      case "song":
        // Navigate to artist page to show more songs from this artist
        const artistName = item.artist || item.channelTitle || "Unknown Artist"
        router.push(`/artist/${encodeURIComponent(artistName)}`)
        break
      case "artist":
        router.push(`/artist/${encodeURIComponent(item.title || item.name || "")}`)
        break
      case "album":
        router.push(`/album/${item.id}`)
        break
      case "playlist":
        router.push(`/playlist/${item.id}`)
        break
    }
  }

  const getCurrentResults = () => {
    switch (activeCategory) {
      case "songs":
        return categorizedResults.songs
      case "artists":
        return categorizedResults.artists
      case "albums":
        return categorizedResults.albums
      case "playlists":
        return categorizedResults.playlists
      default:
        return searchResults
    }
  }

  const getTotalResults = () => {
    return searchResults.length
  }

  const categories = [
    { id: "all", label: "All", count: getTotalResults() },
    { id: "songs", label: "Songs", count: categorizedResults.songs.length },
    { id: "videos", label: "Videos", count: categorizedResults.songs.length },
    { id: "albums", label: "Albums", count: categorizedResults.albums.length },
    { id: "artists", label: "Artists", count: categorizedResults.artists.length },
  ]

  const handleSearch = (query: string) => {
    // Implement the search logic here
    console.log("Searching for:", query)
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        {showInput ? (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search for songs, artists, albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-gray-400 rounded-full"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex-1">
            <h1 className="text-xl font-normal text-white">{query}</h1>
          </div>
        )}
      </header>

      {/* Category Tabs */}
      {query && getTotalResults() > 0 && !showInput && (
        <div className="px-4 py-3 bg-zinc-900">
          <div className="flex gap-1 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 rounded-full px-4 py-2 ${
                  activeCategory === category.id
                    ? "bg-white text-black hover:bg-gray-200"
                    : "text-gray-300 hover:text-white hover:bg-zinc-800"
                }`}
                disabled={category.count === 0}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-24">
        {getTotalResults() > 0 && !loading && !showInput && (
          <div className="space-y-8">
            {/* Top Result */}
            {activeCategory === "all" && categorizedResults.topResult && (
              <div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Top result</h2>
                <div
                  className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 rounded-lg cursor-pointer"
                  onClick={() => handleItemClick(categorizedResults.topResult!)}
                >
                  <div className="w-16 h-16 bg-zinc-700 rounded-full overflow-hidden flex-shrink-0">
                    {categorizedResults.topResult.thumbnail ? (
                      <img
                        src={categorizedResults.topResult.thumbnail || "/placeholder.svg"}
                        alt={categorizedResults.topResult.title || categorizedResults.topResult.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {categorizedResults.topResult.title || categorizedResults.topResult.name}
                    </h3>
                  </div>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Current Results */}
            <div className="space-y-2">
              {getCurrentResults().map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center gap-4 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="w-12 h-12 bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail || "/placeholder.svg"}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{item.title || item.name}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <User className="w-4 h-4" />
                      <span>{item.artist || item.channelTitle || "Unknown Artist"}</span>
                      {item.duration && (
                        <>
                          <span>•</span>
                          <span>{item.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && searchResults.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
            <span className="ml-3 text-gray-400">Loading more results...</span>
          </div>
        )}

        {!hasMore && searchResults.length > 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-400">You've reached the end • {searchResults.length} results total</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => handleSearch(query)} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && query && getTotalResults() === 0 && !showInput && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No results found for "{query}"</p>
            <p className="text-gray-500 text-sm">Try searching with different keywords</p>
          </div>
        )}

        {/* Initial State */}
        {showInput && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Search for music</p>
            <p className="text-gray-500 text-sm">Find songs, artists, and albums</p>
          </div>
        )}
      </div>
    </div>
  )
}
