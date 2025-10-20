"use client"

import { useState, useEffect } from "react"
import { Music, TrendingUp, Clock, ListMusic } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchInterface } from "@/components/search-interface"
import { getPlaylists, type Playlist } from "@/lib/playlist-storage"
import Link from "next/link"
import Image from "next/image"
import { useMusicPlayer } from "@/components/music-player-provider"

export function DashboardContent() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const { playVideo } = useMusicPlayer()

  useEffect(() => {
    setPlaylists(getPlaylists())
  }, [])

  const recentlyPlayed = playlists.flatMap((p) => p.videos).slice(0, 6)

  const trendingSearches = [
    "Top Hits 2025",
    "Chill Vibes",
    "Workout Music",
    "Study Focus",
    "Party Anthems",
    "Acoustic Sessions",
  ]

  if (showSearch) {
    return <SearchInterface />
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-lg text-muted-foreground">Ready to discover your next favorite song?</p>
        </div>
        <Button size="lg" onClick={() => setShowSearch(true)}>
          <Music className="w-5 h-5 mr-2" />
          Search Music
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ListMusic className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{playlists.length}</p>
              <p className="text-sm text-muted-foreground">Playlists</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{playlists.reduce((acc, p) => acc + p.videos.length, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Songs</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recentlyPlayed.length}</p>
              <p className="text-sm text-muted-foreground">Recently Added</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Your Playlists */}
      {playlists.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Playlists</h2>
            <Link href="/dashboard/playlists">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.slice(0, 6).map((playlist) => (
              <Link key={playlist.id} href="/dashboard/playlists">
                <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <ListMusic className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{playlist.name}</h3>
                      <p className="text-sm text-muted-foreground">{playlist.videos.length} songs</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {recentlyPlayed.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recently Added</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentlyPlayed.map((video) => (
              <Card
                key={video.id}
                className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                onClick={() => playVideo(video)}
              >
                <div className="relative aspect-square">
                  <Image src={video.thumbnail || "/placeholder.svg"} alt={video.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Music className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Trending Searches */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Trending Searches</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {trendingSearches.map((search) => (
            <Button key={search} variant="outline" onClick={() => setShowSearch(true)}>
              {search}
            </Button>
          ))}
        </div>
      </div>

      {/* Get Started */}
      {playlists.length === 0 && (
        <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5">
          <Music className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Start Your Music Journey</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Search for your favorite songs, create playlists, and enjoy unlimited music streaming
          </p>
          <Button size="lg" onClick={() => setShowSearch(true)}>
            <Music className="w-5 h-5 mr-2" />
            Search for Music
          </Button>
        </Card>
      )}
    </div>
  )
}
