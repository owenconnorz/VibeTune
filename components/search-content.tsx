"use client"

import { useState, useEffect } from "react"
import { Search, ArrowLeft, Globe, Clock, ArrowUpRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useMusicPlayer } from "@/components/music-player-provider"
import type { YouTubeVideo } from "@/lib/innertube"
import Image from "next/image"
import { useAPI } from "@/lib/use-api"
import { searchHistory } from "@/lib/cache"

export function SearchContent() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const { playVideo } = useMusicPlayer()

  const { data: suggestionsData } = useAPI<{ suggestions: string[] }>(
    query.length >= 2 ? `/api/music/suggestions?q=${encodeURIComponent(query)}` : null,
  )

  const { data, isLoading } = useAPI<{ videos: YouTubeVideo[] }>(
    debouncedQuery ? `/api/music/search?q=${encodeURIComponent(debouncedQuery)}` : null,
  )

  const results = data?.videos || []
  const suggestions = suggestionsData?.suggestions || []

  const topResult = results[0]
  const otherResults = results.slice(1)

  useEffect(() => {
    setHistory(searchHistory.get())
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim()) {
        setDebouncedQuery(query.trim())
        searchHistory.add(query.trim())
        setHistory(searchHistory.get())
        setShowSuggestions(false)
      } else {
        setDebouncedQuery("")
      }
    }, 500)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
  }

  const clearHistory = () => {
    searchHistory.clear()
    setHistory([])
  }

  const handleResultClick = (video: YouTubeVideo) => {
    // Check if this looks like an artist channel (you can enhance this logic)
    const isArtistChannel = video.artist && !video.title.includes("Official Video")

    if (isArtistChannel && video.channelId) {
      router.push(`/dashboard/artist/${video.channelId}`)
    } else {
      playVideo(video)
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search YouTube Music..."
                className="pl-10 bg-secondary border-0 h-12 rounded-full"
              />
              {showSuggestions && query.length >= 2 && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Search className="w-5 h-5 text-muted-foreground" />
                      <span className="flex-1">{suggestion}</span>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon">
              <Globe className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {!query.trim() && history.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Recent Searches</h3>
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                Clear
              </Button>
            </div>
            <div className="space-y-2">
              {history.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            {topResult && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-primary">Top result</h2>
                <button
                  onClick={() => handleResultClick(topResult)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={topResult.thumbnail || "/placeholder.svg"}
                      alt={topResult.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{topResult.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{topResult.artist}</p>
                  </div>
                </button>
              </div>
            )}

            {otherResults.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Other</h2>
                <div className="space-y-2">
                  {otherResults.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleResultClick(video)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{video.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{video.artist}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{video.duration}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : query.trim() ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            <p>No results found</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            <p>Start typing to search for music...</p>
          </div>
        )}
      </div>
    </div>
  )
}
