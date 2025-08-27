"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X, Play, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSearchMusic } from "@/hooks/use-music-data"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { SongSkeleton, ErrorMessage } from "@/components/loading-skeleton"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const POPULAR_SUGGESTIONS = [
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
]

const TRENDING_SEARCHES = [
  "Top hits 2024",
  "Chill vibes",
  "Workout music",
  "Study music",
  "Party playlist",
  "Love songs",
  "Road trip music",
  "Relaxing music",
  "Upbeat songs",
  "Acoustic covers",
]

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { playTrack, playQueue } = useAudioPlayer()

  const { songs, loading, error } = useSearchMusic(query, query.length > 2)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (query.length > 0) {
      const allSuggestions = [...POPULAR_SUGGESTIONS, ...TRENDING_SEARCHES, ...recentSearches]
      const filtered = allSuggestions
        .filter(
          (suggestion) =>
            suggestion.toLowerCase().includes(query.toLowerCase()) && suggestion.toLowerCase() !== query.toLowerCase(),
        )
        .slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query, recentSearches])

  const saveSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  const handlePlaySong = (song: any) => {
    const track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
    }
    playTrack(track)
    saveSearch(query)
  }

  const safeSongs = Array.isArray(songs) ? songs : []

  const handlePlayAll = () => {
    if (safeSongs.length === 0) return

    const tracks = safeSongs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
    }))
    playQueue(tracks, 0)
    saveSearch(query)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16">
      <div className="bg-zinc-900 w-full h-[50vh] mx-4 rounded-lg shadow-xl overflow-hidden md:max-w-2xl md:h-auto md:max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center gap-4 p-4 border-b border-zinc-700">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for songs, artists, albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              className="w-full bg-zinc-800 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg mt-1 shadow-lg z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-zinc-700 text-white first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    <Search className="inline w-4 h-4 mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Content */}
        <div className="overflow-y-auto h-[calc(50vh-80px)] md:max-h-[calc(80vh-80px)]">
          {query.length === 0 ? (
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Recent searches</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="space-y-2 mb-6">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(search)}
                        className="flex items-center gap-3 w-full text-left p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{search}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">Trending searches</h3>
                <div className="grid grid-cols-2 gap-2">
                  {TRENDING_SEARCHES.slice(0, 6).map((trend, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(trend)}
                      className="text-left p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <span className="text-white text-sm">{trend}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4">Popular genres</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SUGGESTIONS.slice(0, 10).map((genre, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(genre)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-yellow-400 hover:text-black rounded-full text-sm text-white transition-colors"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {recentSearches.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Start typing to search for music</p>
                </div>
              )}
            </div>
          ) : query.length <= 2 ? (
            <div className="p-4 text-center text-gray-400">
              <p>Type at least 3 characters to search</p>
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorMessage message={error} />
            </div>
          ) : loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SongSkeleton key={i} />
              ))}
            </div>
          ) : safeSongs.length === 0 ? (
            <div className="p-4 text-center py-12">
              <p className="text-gray-400">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  {safeSongs.length} result{safeSongs.length !== 1 ? "s" : ""} for "{query}"
                </h3>
                <Button
                  onClick={handlePlayAll}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 text-sm px-4 py-2"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play all
                </Button>
              </div>

              <div className="space-y-2">
                {safeSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 p-2 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handlePlaySong(song)}
                  >
                    <img
                      src={song.thumbnail || "/placeholder.svg?height=48&width=48"}
                      alt={`${song.title} thumbnail`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{song.title}</h4>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                    </div>
                    <div className="text-xs text-gray-500">{song.duration}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
