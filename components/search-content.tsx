"use client"

import { useState, useEffect } from "react"
import { Search, ArrowLeft, Globe, Clock } from "lucide-react"
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
  const router = useRouter()
  const { playVideo } = useMusicPlayer()

  const { data, isLoading } = useAPI<{ videos: YouTubeVideo[] }>(
    debouncedQuery ? `/api/music/search?q=${encodeURIComponent(debouncedQuery)}` : null,
  )

  const results = data?.videos || []

  useEffect(() => {
    setHistory(searchHistory.get())
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim()) {
        setDebouncedQuery(query.trim())
        searchHistory.add(query.trim())
        setHistory(searchHistory.get())
      } else {
        setDebouncedQuery("")
      }
    }, 500)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
  }

  const clearHistory = () => {
    searchHistory.clear()
    setHistory([])
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search YouTube Music..."
                className="pl-10 bg-secondary border-0 h-12 rounded-full"
              />
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
          <div className="space-y-2">
            {results.map((video) => (
              <button
                key={video.id}
                onClick={() => playVideo(video)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={video.thumbnail || "/placeholder.svg"} alt={video.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{video.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{video.artist}</p>
                </div>
                <span className="text-sm text-muted-foreground">{video.duration}</span>
              </button>
            ))}
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
