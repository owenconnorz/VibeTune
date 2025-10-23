"use client"

import { useState, useEffect } from "react"
import { Heart, CheckCircle, TrendingUp, RefreshCw, Cloud, Plus, Grid3x3, List, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Link from "next/link"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { getPlaylists, type Playlist } from "@/lib/playlist-storage"
import { getLikedSongsCount } from "@/lib/liked-storage"

const tabs = ["Playlists", "Songs", "Albums", "Artists"]

export function LibraryContent() {
  const [selectedTab, setSelectedTab] = useState("Playlists")
  const [sortBy, setSortBy] = useState("Date added")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [likedCount, setLikedCount] = useState(0)

  useEffect(() => {
    setUserPlaylists(getPlaylists())
    setLikedCount(getLikedSongsCount())
    const savedView = localStorage.getItem("library-view-mode")
    if (savedView === "list" || savedView === "grid") {
      setViewMode(savedView)
    }
  }, [])

  const handlePlaylistCreated = () => {
    setUserPlaylists(getPlaylists())
  }

  const toggleViewMode = () => {
    const newMode = viewMode === "grid" ? "list" : "grid"
    setViewMode(newMode)
    localStorage.setItem("library-view-mode", newMode)
  }

  const systemPlaylists = [
    { id: "liked", name: "Liked", icon: Heart, count: likedCount },
    { id: "downloaded", name: "Downloaded", icon: CheckCircle, count: 0 },
    { id: "top10", name: "My top 10", icon: TrendingUp, count: 0 },
    { id: "cached", name: "Cached", icon: RefreshCw, count: 0 },
    { id: "uploaded", name: "Uploaded", icon: Cloud, count: 0 },
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Tabs */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 py-4">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant={selectedTab === tab ? "default" : "secondary"}
                className="rounded-full px-6 whitespace-nowrap"
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Sort and View Options */}
        <div className="flex items-center justify-between px-4">
          <Button variant="ghost" className="gap-2">
            {sortBy}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {systemPlaylists.length + userPlaylists.length} playlists
            </span>
            <Button variant="ghost" size="icon" onClick={toggleViewMode} className="rounded-xl">
              {viewMode === "grid" ? <Grid3x3 className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {viewMode === "grid" ? (
          // Grid View
          <div className="px-4 grid grid-cols-2 gap-4">
            {systemPlaylists.map((playlist) => (
              <Link key={playlist.id} href={`/dashboard/playlist/${playlist.id}`}>
                <div className="aspect-square rounded-2xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <playlist.icon className="w-16 h-16 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mt-2">{playlist.name}</h3>
                {playlist.count > 0 && <p className="text-sm text-muted-foreground">{playlist.count} songs</p>}
              </Link>
            ))}

            {userPlaylists.map((playlist) => (
              <Link key={playlist.id} href={`/dashboard/playlist/${playlist.id}`}>
                <div className="aspect-square rounded-2xl bg-secondary overflow-hidden hover:opacity-80 transition-opacity">
                  {playlist.coverImage ? (
                    <img
                      src={playlist.coverImage || "/placeholder.svg"}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="grid grid-cols-2 h-full">
                      {playlist.videos.slice(0, 4).map((video, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {/* Fill empty slots if less than 4 videos */}
                      {Array.from({ length: Math.max(0, 4 - playlist.videos.length) }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="bg-primary/20" />
                      ))}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold mt-2">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground">{playlist.videos.length} songs</p>
              </Link>
            ))}

            <button
              onClick={() => setShowCreateDialog(true)}
              className="aspect-square rounded-2xl bg-secondary flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-12 h-12 text-muted-foreground" />
            </button>
          </div>
        ) : (
          // List View
          <div className="px-4 space-y-2">
            {systemPlaylists.map((playlist) => (
              <Link key={playlist.id} href={`/dashboard/playlist/${playlist.id}`}>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <playlist.icon className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{playlist.name}</h3>
                    {playlist.count > 0 && <p className="text-sm text-muted-foreground">{playlist.count} songs</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </Link>
            ))}

            {userPlaylists.map((playlist) => (
              <Link key={playlist.id} href={`/dashboard/playlist/${playlist.id}`}>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="w-14 h-14 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                    {playlist.coverImage ? (
                      <img
                        src={playlist.coverImage || "/placeholder.svg"}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="grid grid-cols-2 h-full">
                        {playlist.videos.slice(0, 4).map((video, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={video.thumbnail || "/placeholder.svg"}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {/* Fill empty slots if less than 4 videos */}
                        {Array.from({ length: Math.max(0, 4 - playlist.videos.length) }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="bg-primary/20" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">{playlist.videos.length} songs</p>
                  </div>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreatePlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </>
  )
}
