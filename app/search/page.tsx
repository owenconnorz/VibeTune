"use client"

import { useState, useEffect } from "react"
import { Search, ArrowLeft, Play, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { BulkDownloadButton } from "@/components/bulk-download-button"
import { searchMusic } from "@/lib/music-data"

export default function SearchPage() {
  const router = useRouter()
  const { playQueue } = useAudioPlayer()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const searchResults = await searchMusic(searchQuery)
      setResults(searchResults)
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

  const handlePlaySong = (song: any, songList: any[]) => {
    const tracks = songList.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.artist || s.channelTitle || "Unknown Artist",
      thumbnail: s.thumbnail,
      duration: s.duration,
    }))
    const startIndex = songList.findIndex((s) => s.id === song.id)
    playQueue(tracks, startIndex)
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search for songs, artists, albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
            autoFocus
          />
        </div>
      </header>

      <div className="px-4 pb-24">
        {/* Results Header */}
        {results.length > 0 && (
          <div className="flex items-center justify-between py-4">
            <h2 className="text-xl font-bold text-white">
              {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </h2>
            <BulkDownloadButton songs={results} label="Download All" />
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

        {/* Search Results */}
        {results.length > 0 && !loading && (
          <div className="space-y-2">
            {results.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                onClick={() => handlePlaySong(song, results)}
              >
                <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                  {song.thumbnail ? (
                    <img
                      src={song.thumbnail || "/placeholder.svg"}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{song.title}</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {song.artist || song.channelTitle || "Unknown Artist"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {song.duration && <span className="text-gray-500 text-sm">{song.duration}</span>}
                  <AddToPlaylistDialog
                    songs={[song]}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No results found for "{query}"</p>
            <p className="text-gray-500 text-sm">Try searching with different keywords</p>
          </div>
        )}

        {/* Initial State */}
        {!query && (
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
