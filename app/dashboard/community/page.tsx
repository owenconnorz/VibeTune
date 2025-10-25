"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Clock, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { getPlaylists, type Playlist } from "@/lib/playlist-storage"
import { getHistory } from "@/lib/history-storage"
import { ProgressiveImage } from "@/components/progressive-image"

export default function CommunityPage() {
  const router = useRouter()
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [popularPlaylists, setPopularPlaylists] = useState<Playlist[]>([])

  useEffect(() => {
    const history = getHistory()
    setRecentActivity(history.slice(0, 10))

    const playlists = getPlaylists()
    setPopularPlaylists(playlists.slice(0, 6))
  }, [])

  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Community</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--chart-2))]" />
            <h2 className="text-2xl font-bold">Trending Now</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {popularPlaylists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => router.push(`/dashboard/playlist/${playlist.id}`)}
                className="flex flex-col gap-2 p-3 rounded-lg hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-secondary">
                  {playlist.coverImage ? (
                    <ProgressiveImage src={playlist.coverImage} alt={playlist.name} rounded="lg" />
                  ) : (
                    <div className="grid grid-cols-2 h-full">
                      {playlist.videos.slice(0, 4).map((video, index) => (
                        <div
                          key={video.id}
                          className="relative bg-cover bg-center"
                          style={{
                            backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : "none",
                            backgroundColor: !video.thumbnail
                              ? `hsl(var(--primary) / ${0.2 + index * 0.1})`
                              : undefined,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold truncate">{playlist.name}</h3>
                  <p className="text-sm text-muted-foreground">{playlist.videos.length} songs</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[hsl(var(--chart-2))]" />
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                    {item.thumbnail && <ProgressiveImage src={item.thumbnail} alt={item.title} rounded="md" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.artist || "Unknown Artist"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(item.playedAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[hsl(var(--chart-2))]" />
            <h2 className="text-2xl font-bold">Shared with You</h2>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No shared playlists yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              When friends share playlists with you, they'll appear here
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
