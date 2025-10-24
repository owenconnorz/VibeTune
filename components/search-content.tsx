"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Clock, ArrowUpRight, Loader2, AlertCircle, MoreVertical, X, Check, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useMusicPlayer } from "@/components/music-player-provider"
import type { YouTubeVideo } from "@/lib/innertube"
import { useAPI } from "@/lib/use-api"
import { searchHistory } from "@/lib/cache"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProgressiveImage } from "@/components/progressive-image"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Link from "next/link"
import { isDownloaded } from "@/lib/download-storage"

type FilterType = "all" | "songs" | "videos" | "albums" | "artists"

const moodAndGenres = [
  { id: "energize", name: "Energize", query: "energetic workout music" },
  { id: "blues", name: "Blues", query: "blues music" },
  { id: "indie-alternative", name: "Indie & alternative", query: "indie alternative music" },
  { id: "commute", name: "Commute", query: "commute driving music" },
  { id: "uk-rap", name: "UK rap", query: "uk rap grime music" },
  { id: "cosy-season", name: "Cosy Season 🍁", query: "cosy autumn fall music" },
  { id: "feel-good", name: "Feel good", query: "feel good happy music" },
  { id: "1990s", name: "1990s", query: "1990s music hits" },
  { id: "folk-acoustic", name: "Folk & acoustic", query: "folk acoustic music" },
  { id: "sleep", name: "Sleep", query: "sleep relaxing music" },
  { id: "iraqi", name: "Iraqi", query: "iraqi arabic music" },
  { id: "party", name: "Party", query: "party dance music" },
  { id: "pop", name: "Pop", query: "pop music hits" },
  { id: "metal", name: "Metal", query: "metal rock music" },
  { id: "rock", name: "Rock", query: "rock music" },
  { id: "classical", name: "Classical", query: "classical music" },
  { id: "1980s", name: "1980s", query: "1980s music hits" },
  { id: "romance", name: "Romance", query: "romantic love songs" },
  { id: "1960s", name: "1960s", query: "1960s music hits" },
  { id: "1950s", name: "1950s", query: "1950s music hits" },
  { id: "desi-hiphop", name: "Desi hip-hop", query: "desi hip hop music" },
  { id: "2010s", name: "2010s", query: "2010s music hits" },
  { id: "2000s", name: "2000s", query: "2000s music hits" },
  { id: "kpop", name: "K-Pop", query: "k-pop korean music" },
]

export function SearchContent() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [paginatedResults, setPaginatedResults] = useState<YouTubeVideo[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [downloadedStates, setDownloadedStates] = useState<Record<string, boolean>>({})

  const router = useRouter()
  const { playVideo } = useMusicPlayer()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 400) // Wait 400ms after user stops typing

    return () => clearTimeout(timer)
  }, [query])

  const { data: suggestionsData } = useAPI<{ suggestions: string[] }>(
    debouncedQuery.length >= 1 ? `/api/music/suggestions?q=${encodeURIComponent(debouncedQuery)}` : null,
  )

  const searchType = activeFilter === "videos" ? "youtube" : "music"

  const { data, isLoading, error } = useAPI<{
    videos: YouTubeVideo[]
    nextPageToken: string | null
    error?: string
    quotaExceeded?: boolean
  }>(debouncedQuery.length >= 1 ? `/api/music/search?q=${encodeURIComponent(debouncedQuery)}&type=${searchType}` : null)

  const suggestions = suggestionsData?.suggestions || []

  useEffect(() => {
    if (data) {
      console.log("[v0] Search data received:", {
        totalResults: data.videos?.length || 0,
        artists: data.videos?.filter((v) => (v as any).type === "artist").length || 0,
        songs: data.videos?.filter((v) => !(v as any).browseId && (v as any).type !== "youtube_video").length || 0,
        videos: data.videos?.filter((v) => (v as any).type === "youtube_video").length || 0,
      })

      if (data.videos && data.videos.length > 0) {
        console.log(
          "[v0] First 3 results:",
          data.videos.slice(0, 3).map((v) => ({
            title: v.title,
            type: (v as any).type,
            browseId: (v as any).browseId,
            subscribers: (v as any).subscribers,
          })),
        )
      }

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

  const filteredResults = allResults.filter((video) => {
    if (activeFilter === "all") return true
    if (activeFilter === "songs") return !(video as any).browseId && (video as any).type !== "youtube_video"
    if (activeFilter === "videos") return (video as any).type === "youtube_video"
    if (activeFilter === "albums") return (video as any).type === "album"
    if (activeFilter === "artists") return (video as any).type === "artist"
    return true
  })

  useEffect(() => {
    if (filteredResults.length > 0) {
      console.log("[v0] Filtered results:", {
        activeFilter,
        totalFiltered: filteredResults.length,
        artists: filteredResults.filter((v) => (v as any).type === "artist").length,
        topResultType: (filteredResults[0] as any).type,
        topResultTitle: filteredResults[0].title,
      })
    }
  }, [filteredResults, activeFilter])

  const topResult = filteredResults.length > 0 ? filteredResults[0] : null
  const otherResults = filteredResults.slice(1)

  const loadMoreResults = useCallback(async () => {
    if (!nextPageToken || isLoadingMore || !debouncedQuery) return

    setIsLoadingMore(true)

    try {
      const response = await fetch(
        `/api/music/search?q=${encodeURIComponent(debouncedQuery)}&pageToken=${nextPageToken}&type=${searchType}`,
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
  }, [nextPageToken, isLoadingMore, debouncedQuery, searchType])

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: loadMoreResults,
    hasMore: !!nextPageToken,
    isLoading: isLoadingMore,
  })

  useEffect(() => {
    setHistory(searchHistory.get())
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchHistory.add(debouncedQuery.trim())
      setHistory(searchHistory.get())
      setApiError(null)
    } else {
      setPaginatedResults([])
      setNextPageToken(null)
      setApiError(null)
    }
  }, [debouncedQuery]) // Use debouncedQuery instead of query

  useEffect(() => {
    setPaginatedResults([])
    setNextPageToken(null)
  }, [activeFilter])

  useEffect(() => {
    const checkDownloadedStates = async () => {
      if (allResults.length === 0) return

      const downloadStates: Record<string, boolean> = {}
      for (const video of allResults) {
        downloadStates[video.id] = await isDownloaded(video.id)
      }
      setDownloadedStates(downloadStates)
    }
    checkDownloadedStates()
  }, [allResults])

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
      const videoIndex = allResults.findIndex((v) => v.id === video.id)
      const remainingVideos = allResults.slice(videoIndex + 1).filter((v) => !(v as any).browseId)
      playVideo(video, remainingVideos)
    }
  }

  const renderResultItem = (video: YouTubeVideo, index: number) => {
    const isArtist = (video as any).type === "artist"
    const isYouTubeVideo = (video as any).type === "youtube_video"

    return (
      <button
        key={`${video.id}-${index}`}
        onClick={() => handleResultClick(video)}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors text-left group"
      >
        <div className={`relative ${isArtist ? "w-16 h-16" : "w-14 h-14"} flex-shrink-0`}>
          <ProgressiveImage
            src={video.thumbnail || "/placeholder.svg"}
            alt={video.title}
            rounded={isArtist ? "full" : "lg"}
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
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
            {!isArtist && !isYouTubeVideo && downloadedStates[video.id] && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[hsl(var(--chart-2))] flex-shrink-0">
                <Check className="w-3 h-3 text-black" />
              </span>
            )}
            {isArtist ? (
              (video as any).subscribers || "Artist"
            ) : isYouTubeVideo ? (
              <>
                {video.artist}
                {(video as any).views && ` • ${(video as any).views}`}
                {(video as any).publishedTime && ` • ${(video as any).publishedTime}`}
              </>
            ) : (
              `${video.artist}${video.duration ? ` • ${video.duration}` : ""}`
            )}
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
  }

  const showSuggestionsDropdown = query.length > 0 && suggestions.length > 0
  const hasSearchResults = filteredResults.length > 0

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

        {query && (
          <ScrollArea className="w-full">
            <div className="flex gap-2 px-4 pb-3">
              <Button
                variant={activeFilter === "all" ? "default" : "secondary"}
                className="rounded-full px-6 whitespace-nowrap"
                onClick={() => setActiveFilter("all")}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "songs" ? "default" : "secondary"}
                className="rounded-full px-6 whitespace-nowrap"
                onClick={() => setActiveFilter("songs")}
              >
                Songs
              </Button>
              <Button
                variant={activeFilter === "videos" ? "default" : "secondary"}
                className="rounded-full px-6 whitespace-nowrap"
                onClick={() => setActiveFilter("videos")}
              >
                Videos
              </Button>
              <Button
                variant={activeFilter === "albums" ? "default" : "secondary"}
                className="rounded-full px-6 whitespace-nowrap"
                onClick={() => setActiveFilter("albums")}
              >
                Albums
              </Button>
              <Button
                variant={activeFilter === "artists" ? "default" : "secondary"}
                className="rounded-full px-6 whitespace-nowrap"
                onClick={() => setActiveFilter("artists")}
              >
                Artists
              </Button>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
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

        {showSuggestionsDropdown && !hasSearchResults && (
          <div className="space-y-1">
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

        {query && isLoading && !hasSearchResults && (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {query && hasSearchResults && (
          <div className="space-y-6">
            {showSuggestionsDropdown && (
              <div className="space-y-1">
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

            {topResult && (
              <div>
                <h2 className="text-xl font-bold mb-3">Top result</h2>
                <div className="space-y-1">{renderResultItem(topResult, 0)}</div>
              </div>
            )}

            {otherResults.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Other</h2>
                <div className="space-y-1">
                  {otherResults.map((video, index) => renderResultItem(video, index + 1))}
                </div>
              </div>
            )}

            {nextPageToken && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-8">
                {isLoadingMore && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
              </div>
            )}
          </div>
        )}

        {query && !isLoading && !hasSearchResults && (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p>No results found</p>
          </div>
        )}

        {!query && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mood and Genres</h2>
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {Array.from({ length: Math.ceil(moodAndGenres.length / 8) }).map((_, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="grid grid-cols-2 gap-3 flex-shrink-0"
                    style={{ width: "calc(100vw - 2rem)" }}
                  >
                    {moodAndGenres.slice(pageIndex * 8, (pageIndex + 1) * 8).map((item) => (
                      <Link
                        key={item.id}
                        href={`/dashboard/category/${item.id}`}
                        className="bg-muted/40 hover:bg-muted/60 rounded-xl px-4 py-3 transition-colors"
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
