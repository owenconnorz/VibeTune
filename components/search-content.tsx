"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Clock, ArrowUpRight, Loader2, AlertCircle, MoreVertical, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useMusicPlayer } from "@/components/music-player-provider"
import type { YouTubeVideo } from "@/lib/innertube"
import Image from "next/image"
import { useAPI } from "@/lib/use-api"
import { searchHistory } from "@/lib/cache"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { Alert, AlertDescription } from "@/components/ui/alert"

type FilterType = "all" | "songs" | "videos" | "albums" | "artists"

export function SearchContent() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [paginatedResults, setPaginatedResults] = useState<YouTubeVideo[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const router = useRouter()
  const { playVideo } = useMusicPlayer()

  const { data: suggestionsData } = useAPI<{ suggestions: string[] }>(
    query.length >= 2 && showSuggestions ? `/api/music/suggestions?q=${encodeURIComponent(query)}` : null,
  )

  const { data, isLoading, error } = useAPI<{
    videos: YouTubeVideo[]
    nextPageToken: string | null
    error?: string
    quotaExceeded?: boolean
  }>(debouncedQuery ? `/api/music/search?q=${encodeURIComponent(debouncedQuery)}` : null)

  const suggestions = suggestionsData?.suggestions || []

  useEffect(() => {
    if (data) {
      if (data.error) {
        setApiError(data.error)
      } else {
        setApiError(null)
        setPaginatedResults([])
        setNextPageToken(data.nextPageToken)
      }
    }
  }, [data])

  useEffect(() => {
    if (error) {
      setApiError("Failed to search. Please try again.")
    }
  }, [error])

  const allResults = data?.videos ? [...data.videos, ...paginatedResults] : paginatedResults

  const loadMoreResults = useCallback(async () => {
    if (!nextPageToken || isLoadingMore || !debouncedQuery) return

    setIsLoadingMore(true)

    try {
      const response = await fetch(
        `/api/music/search?q=${encodeURIComponent(debouncedQuery)}&pageToken=${nextPageToken}`,
      )
      const newData = await response.json()

      if (newData.error) {
        setApiError(newData.error)
        setIsLoadingMore(false)
        return
      }

      setPaginatedResults((prev) => [...prev, ...newData.videos])
      setNextPageToken(newData.nextPageToken)
    } catch (error) {
      setApiError("Failed to load more results")
    } finally {
      setIsLoadingMore(false)
    }
  }, [nextPageToken, isLoadingMore, debouncedQuery])

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: loadMoreResults,
    hasMore: !!nextPageToken,
    isLoading: isLoadingMore,
  })

  const topResult = allResults[0]
  const otherResults = allResults.slice(1)

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
        setApiError(null)
        setPaginatedResults([])
      } else {
        setDebouncedQuery("")
        setPaginatedResults([])
        setNextPageToken(null)
        setApiError(null)
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
    const isArtist = video.artist && video.title === video.artist

    if (isArtist) {
      // Convert artist name to URL-friendly ID
      const artistId = video.artist.toLowerCase().replace(/\s+/g, "-")
      router.push(`/dashboard/artist/${artistId}`)
    } else {
      playVideo(video)
    }
  }

  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search"
              className="bg-secondary/50 border-0 h-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setQuery("")
                  setDebouncedQuery("")
                }}
                className="absolute right-0 top-0 h-10 w-10"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {showSuggestions && (query.length >= 2 || history.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border-t border-border shadow-lg overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                {/* History items */}
                {query.length < 2 && history.length > 0 && (
                  <>
                    {history.map((item, index) => (
                      <button
                        key={`history-${index}`}
                        onClick={() => handleHistoryClick(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate">{item}</span>
                        <X
                          className="w-4 h-4 text-muted-foreground flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newHistory = history.filter((_, i) => i !== index)
                            searchHistory.clear()
                            newHistory.forEach((h) => searchHistory.add(h))
                            setHistory(newHistory)
                          }}
                        />
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </>
                )}
                {/* Suggestions */}
                {query.length >= 2 && suggestions.length > 0 && (
                  <>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`suggestion-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate">{suggestion}</span>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {debouncedQuery && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {(["all", "songs", "videos", "albums", "artists"] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-4">
        {apiError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : allResults.length > 0 ? (
          <div className="space-y-6">
            {topResult && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-primary">Top result</h2>
                <button
                  onClick={() => handleResultClick(topResult)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors text-left group"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={topResult.thumbnail || "/placeholder.svg"}
                      alt={topResult.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{topResult.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{topResult.artist}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Menu functionality
                    }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </button>
              </div>
            )}

            {otherResults.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-muted-foreground">Other</h2>
                <div className="space-y-1">
                  {otherResults.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleResultClick(video)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors text-left group"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{video.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {video.artist} • {video.duration}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Menu functionality
                        }}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </button>
                  ))}
                </div>
                {!apiError && (
                  <div ref={loadMoreRef} className="py-8 flex justify-center">
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading more songs...</span>
                      </div>
                    )}
                    {!isLoadingMore && nextPageToken && (
                      <p className="text-sm text-muted-foreground">Scroll for more</p>
                    )}
                    {!nextPageToken && allResults.length > 20 && (
                      <p className="text-sm text-muted-foreground">No more results</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : query.trim() && !isLoading ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            <p>No results found</p>
          </div>
        ) : !query.trim() ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            <p>Start typing to search for music...</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
