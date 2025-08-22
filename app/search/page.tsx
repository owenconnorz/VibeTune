"use client"

import type React from "react"
import { useEffect } from "react"
import { useState, useMemo } from "react"
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

const POPULAR_QUERIES = [
  "Top hits 2024",
  "Chill music",
  "Workout playlist",
  "Study music",
  "Party songs",
  "Love ballads",
  "Hip hop beats",
  "Electronic dance",
  "Acoustic covers",
  "Jazz classics",
]

const GENRE_SUGGESTIONS = [
  "Hip Hop",
  "Pop",
  "Rock",
  "R&B",
  "Jazz",
  "Electronic",
  "Country",
  "Reggae",
  "Classical",
  "Blues",
  "Folk",
  "Indie",
  "Alternative",
  "Rap",
  "Soul",
  "Funk",
]

export default function SearchPage() {
  const router = useRouter()
  const { playQueue } = useAudioPlayer()
  const [query, setQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const {
    items: searchResults,
    loading,
    hasMore,
    reset: resetSearch,
  } = useInfiniteScroll<SearchResult>({
    fetchMore: async (page: number) => {
      if (!searchQuery.trim()) {
        return { items: [], hasMore: false }
      }

      console.log("[v0] Fetching search results page:", page, "for query:", searchQuery)
      const results = await searchMusicEnhanced(searchQuery, page)

      const allResults = [...results.songs, ...results.artists, ...results.albums, ...results.playlists]

      return {
        items: allResults,
        hasMore: allResults.length >= 20,
      }
    },
    enabled: !!searchQuery.trim(),
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
    if (query.length > 0 && !searchQuery) {
      const recentSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]")
      const allSuggestions = [...POPULAR_QUERIES, ...GENRE_SUGGESTIONS, ...recentSearches]
      const filtered = allSuggestions
        .filter(
          (suggestion) =>
            suggestion.toLowerCase().includes(query.toLowerCase()) && suggestion.toLowerCase() !== query.toLowerCase(),
        )
        .slice(0, 6)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [query, searchQuery])

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
    { id: "videos", label: "Porn", count: categorizedResults.songs.length },
    { id: "albums", label: "Albums", count: categorizedResults.albums.length },
    { id: "artists", label: "Artists", count: categorizedResults.artists.length },
  ]

  const handleSearch = () => {
    if (query.trim()) {
      setSearchQuery(query.trim())
      setShowSuggestions(false)
      resetSearch()
      const recentSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]")
      const updated = [query.trim(), ...recentSearches.filter((s: string) => s !== query.trim())].slice(0, 10)
      localStorage.setItem("recentSearches", JSON.stringify(updated))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleClearSearch = () => {
    setQuery("")
    setSearchQuery("")
    resetSearch()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    resetSearch()
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search for songs, artists, albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            className="pl-10 pr-20 bg-zinc-800 border-zinc-700 text-white placeholder-gray-400 rounded-full"
            autoFocus
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg mt-1 shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-700 text-white first:rounded-t-lg last:rounded-b-lg transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-7 px-2 text-gray-400 hover:text-white"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearch}
              disabled={!query.trim()}
              className="h-7 px-2 text-gray-400 hover:text-white disabled:opacity-50"
            >
              Search
            </Button>
          </div>
        </div>
      </header>

      {searchQuery && getTotalResults() > 0 && (
        <div className="px-4 py-2 bg-zinc-800/50">
          <p className="text-sm text-gray-400">
            Results for: <span className="text-white font-medium">"{searchQuery}"</span>
          </p>
        </div>
      )}

      {searchQuery && getTotalResults() > 0 && (
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
        {getTotalResults() > 0 && !loading && (
          <div className="space-y-8">
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

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={handleSearch} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && searchQuery && getTotalResults() === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No results found for "{searchQuery}"</p>
            <p className="text-gray-500 text-sm">Try searching with different keywords</p>
          </div>
        )}

        {!searchQuery && (
          <div className="space-y-6 py-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Popular searches</h2>
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_QUERIES.slice(0, 8).map((popularQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(popularQuery)}
                    className="text-left p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <span className="text-white font-medium">{popularQuery}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-4">Browse by genre</h2>
              <div className="flex flex-wrap gap-2">
                {GENRE_SUGGESTIONS.map((genre, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(genre)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-yellow-400 hover:text-black rounded-full text-white transition-colors"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
