"use client"

import { useState, useEffect } from "react"
import { Search, ArrowLeft, MoreVertical, User, Disc, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { searchMusicEnhanced } from "@/lib/music-data"

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
  const [categorizedResults, setCategorizedResults] = useState<CategorizedResults>({
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
  })
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setCategorizedResults({ songs: [], artists: [], albums: [], playlists: [] })
      setShowInput(true)
      return
    }

    setShowInput(false)
    setLoading(true)
    setError(null)

    try {
      const results = await searchMusicEnhanced(searchQuery)

      const allResults = [...results.songs, ...results.artists, ...results.albums, ...results.playlists]

      setCategorizedResults({
        topResult: allResults[0] || undefined,
        songs: results.songs,
        artists: results.artists,
        albums: results.albums,
        playlists: results.playlists,
      })
    } catch (err) {
      setError("Failed to search music")
      console.error("Search error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(query)
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [query])

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
        return [
          ...categorizedResults.songs,
          ...categorizedResults.artists,
          ...categorizedResults.albums,
          ...categorizedResults.playlists,
        ]
    }
  }

  const getTotalResults = () => {
    return (
      categorizedResults.songs.length +
      categorizedResults.artists.length +
      categorizedResults.albums.length +
      categorizedResults.playlists.length
    )
  }

  const categories = [
    { id: "all", label: "All", count: getTotalResults() },
    { id: "songs", label: "Songs", count: categorizedResults.songs.length },
    { id: "videos", label: "Videos", count: categorizedResults.songs.length },
    { id: "albums", label: "Albums", count: categorizedResults.albums.length },
    { id: "artists", label: "Artists", count: categorizedResults.artists.length },
  ]

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

            {/* Songs Section */}
            {(activeCategory === "all" || activeCategory === "songs" || activeCategory === "videos") &&
              categorizedResults.songs.length > 0 && (
                <div>
                  {activeCategory === "all" && <h2 className="text-2xl font-bold text-yellow-400 mb-4">Songs</h2>}
                  <div className="space-y-2">
                    {categorizedResults.songs.slice(0, activeCategory === "all" ? 4 : undefined).map((song, index) => (
                      <div
                        key={`${song.id}-${index}`}
                        className="flex items-center gap-4 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                        onClick={() => handleItemClick(song)}
                      >
                        <div className="w-12 h-12 bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                          {song.thumbnail ? (
                            <img
                              src={song.thumbnail || "/placeholder.svg"}
                              alt={song.title || song.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <Music className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{song.title || song.name}</h3>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <User className="w-4 h-4" />
                            <span>{song.artist || song.channelTitle || "Unknown Artist"}</span>
                            {song.duration && (
                              <>
                                <span>•</span>
                                <span>{song.duration}</span>
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

            {/* Albums Section */}
            {(activeCategory === "all" || activeCategory === "albums") && categorizedResults.albums.length > 0 && (
              <div>
                {activeCategory === "all" && <h2 className="text-2xl font-bold text-yellow-400 mb-4">Albums</h2>}
                <div className="space-y-2">
                  {categorizedResults.albums.slice(0, activeCategory === "all" ? 3 : undefined).map((album, index) => (
                    <div
                      key={`${album.id}-${index}`}
                      className="flex items-center gap-4 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                      onClick={() => handleItemClick(album)}
                    >
                      <div className="w-12 h-12 bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                        {album.thumbnail ? (
                          <img
                            src={album.thumbnail || "/placeholder.svg"}
                            alt={album.title || album.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                            <Disc className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{album.title || album.name}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Disc className="w-4 h-4" />
                          <span>{album.artist || album.channelTitle || "Unknown Artist"}</span>
                          {album.publishedAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(album.publishedAt).getFullYear()}</span>
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

            {/* Artists Section */}
            {(activeCategory === "all" || activeCategory === "artists") && categorizedResults.artists.length > 0 && (
              <div>
                {activeCategory === "all" && <h2 className="text-2xl font-bold text-yellow-400 mb-4">Artists</h2>}
                <div className="space-y-2">
                  {categorizedResults.artists
                    .slice(0, activeCategory === "all" ? 3 : undefined)
                    .map((artist, index) => (
                      <div
                        key={`${artist.id}-${index}`}
                        className="flex items-center gap-4 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                        onClick={() => handleItemClick(artist)}
                      >
                        <div className="w-12 h-12 bg-zinc-700 rounded-full overflow-hidden flex-shrink-0">
                          {artist.thumbnail ? (
                            <img
                              src={artist.thumbnail || "/placeholder.svg"}
                              alt={artist.title || artist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{artist.title || artist.name}</h3>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <User className="w-4 h-4" />
                            <span>Artist</span>
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
