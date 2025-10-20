"use client"

import type React from "react"

import { useState } from "react"
import { Search, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VideoGrid } from "@/components/video-grid"
import type { YouTubeVideo } from "@/lib/youtube"

interface SearchInterfaceProps {
  onBack?: () => void
}

export function SearchInterface({ onBack }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setVideos(data.videos)
      setNextPageToken(data.nextPageToken)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!nextPageToken) return

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&pageToken=${nextPageToken}`)
      const data = await response.json()
      setVideos([...videos, ...data.videos])
      setNextPageToken(data.nextPageToken)
    } catch (error) {
      console.error("Load more failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for songs, artists, or albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
      </div>

      {videos.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Search Results</h2>
            <VideoGrid videos={videos} />
          </div>

          {nextPageToken && (
            <div className="flex justify-center">
              <Button onClick={loadMore} variant="outline" disabled={loading}>
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}

      {videos.length === 0 && !loading && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start searching for music</h3>
          <p className="text-muted-foreground">Enter a song, artist, or album name to discover music</p>
        </div>
      )}
    </div>
  )
}
