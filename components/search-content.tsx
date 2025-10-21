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
  const [paginatedResults, setPaginatedResults] = useState<YouTubeVideo[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const router = useRouter()
  const { playVideo } = useMusicPlayer()

  const { data: suggestionsData } = useAPI<{ suggestions: string[] }>(
    query.length >= 1 ? `/api/music/suggestions?q=${encodeURIComponent(query)}` : null,
  )

  const { data, isLoading, error } = useAPI<{
    videos: YouTubeVideo[]
    nextPageToken: string | null
    error?: string
    quotaExceeded?: boolean
  }>(query.length >= 1 ? `/api/music/search?q=${encodeURIComponent(query)}` : null)

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

  useEffect(() => {
    setHistory(searchHistory.get())
  }, [])

  useEffect(() => {
    if (query.trim()) {
      searchHistory.add(query.trim())
      setHistory(searchHistory.get())
      setApiError(null)
    } else {
      setPaginatedResults([])
      setNextPageToken(null)
      setApiError(null)
    }
  }, [query])

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
  }

  const clearHistory = () => {
    searchHistory.clear()
    setHistory([])
  }

  const handleResultClick = (video: YouTubeVideo) => {
    const isArtist = (video as any).browseId && (video as any).type === "artist"

    if (isArtist) {
      router.push(`/dashboard/artist/${(video as any).browseId}`)
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search YouTube Music..."
              className="bg-secondary/50 border-0 h-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuery("")}
                className="absolute right-0 top-0 h-10 w-10"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {apiError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {!query && history.length > 0 && (
          <div className="space-y-1">
            {history.map((item, index) => (
              <button
                key={`history-${index}`}
                onClick={() => handleHistoryClick(item)}
                className="w-full flex items-center gap-3 px-2 py-3 hover:bg-secondary/50 transition-colors text-left rounded-lg"
              >
                <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{item}</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {query && suggestions.length > 0 && (
          <div className="space-y-1 mb-6">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={`suggestion-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-2 py-3 hover:bg-secondary/50 transition-colors text-left rounded-lg"
              >
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{suggestion}</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {query && isLoading && allResults.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : query && allResults.length > 0 ? (
          <div className="space-y-1">
            {allResults.map((video, index) => {
              const isArtist = (video as any).type === "artist"

              return (
                <button
                  key={`${video.id}-${index}`}
                  onClick={() => handleResultClick(video)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors text-left group"
                >
                  <div
                    className={`relative w-14 h-14 ${isArtist ? "rounded-full" : "rounded-lg"} overflow-hidden flex-shrink-0`}
                  >
                    <Image
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate flex items-center gap-2">
                      {(video as any).isExplicit && (
                        <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold border border-muted-foreground text-muted-foreground rounded-sm flex-shrink-0">
                          E
                        </span>
                      )}
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {isArtist && (video as any).subscribers
                        ? (video as any).subscribers
                        : `${video.artist}${video.duration ? ` • ${video.duration}` : ""}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </button>
              )
            })}
          </div>
        ) : query && !isLoading && allResults.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p>No results found</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
