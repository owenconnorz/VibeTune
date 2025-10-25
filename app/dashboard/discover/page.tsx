"use client"

import { useState, useEffect } from "react"
import { Play, Sparkles, TrendingUp, Heart, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMusicPlayer } from "@/components/music-player-provider"
import { getTopArtists, generatePersonalizedPlaylistName } from "@/lib/recommendations"
import { ProgressiveImage } from "@/components/progressive-image"
import type { YouTubeVideo } from "@/lib/innertube"
import { Skeleton } from "@/components/ui/skeleton"

export default function DiscoverPage() {
  const { playVideo } = useMusicPlayer()
  const [recommendations, setRecommendations] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [playlistName, setPlaylistName] = useState("")
  const [topArtists, setTopArtists] = useState<string[]>([])

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true)

      // Get user's top artists
      const artists = getTopArtists(5)
      setTopArtists(artists)

      if (artists.length === 0) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/recommendations?artists=${artists.join(",")}&type=mix`)
        const data = await response.json()

        setRecommendations(data.videos || [])
        setPlaylistName(generatePersonalizedPlaylistName())
      } catch (error) {
        console.error("[v0] Error loading recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [])

  const handlePlayAll = () => {
    if (recommendations.length > 0) {
      const [first, ...rest] = recommendations
      playVideo(first, rest)
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Discover</h1>
              <p className="text-sm text-muted-foreground">Personalized for you</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Personalized Mix */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{playlistName || "Your Daily Mix"}</h2>
              <p className="text-sm text-muted-foreground">Based on your listening history</p>
            </div>
            {recommendations.length > 0 && (
              <Button onClick={handlePlayAll} size="sm">
                <Play className="w-4 h-4 mr-2 fill-current" />
                Play All
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Start Listening</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Play some songs and like your favorites to get personalized recommendations
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendations.map((video, index) => (
                <div
                  key={video.id}
                  className="cursor-pointer group"
                  onClick={() => {
                    const remaining = recommendations.slice(index + 1)
                    playVideo(video, remaining)
                  }}
                >
                  <div className="relative aspect-square mb-2">
                    <ProgressiveImage src={video.thumbnail} alt={video.title} rounded="lg" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Play className="w-12 h-12 fill-white text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{video.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{video.artist}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Artists */}
        {topArtists.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Your Top Artists</h2>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {topArtists.map((artist, index) => (
                  <div
                    key={artist}
                    className="w-40 flex-shrink-0 cursor-pointer group"
                    onClick={() => {
                      // Navigate to artist search
                      window.location.href = `/dashboard/search?q=${encodeURIComponent(artist)}`
                    }}
                  >
                    <div className="relative aspect-square mb-2 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary/30">#{index + 1}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm text-center truncate">{artist}</h3>
                    <p className="text-xs text-muted-foreground text-center">Top Artist</p>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-bold mb-4">Explore More</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 bg-transparent"
              onClick={() => (window.location.href = "/dashboard/history")}
            >
              <Clock className="w-6 h-6" />
              <span>Recently Played</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 bg-transparent"
              onClick={() => (window.location.href = "/dashboard/playlist/liked")}
            >
              <Heart className="w-6 h-6" />
              <span>Liked Songs</span>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
