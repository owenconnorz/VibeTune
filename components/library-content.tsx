"use client"

import { useState, useEffect } from "react"
import { Heart, CheckCircle, TrendingUp, RefreshCw, Cloud, Plus, Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Link from "next/link"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { getPlaylists, type Playlist } from "@/lib/playlist-storage"

const tabs = ["Playlists", "Songs", "Albums", "Artists"]

const systemPlaylists = [
  { id: "liked", name: "Liked", icon: Heart, count: 0 },
  { id: "downloaded", name: "Downloaded", icon: CheckCircle, count: 0 },
  { id: "top10", name: "My top 10", icon: TrendingUp, count: 0 },
  { id: "cached", name: "Cached", icon: RefreshCw, count: 0 },
  { id: "uploaded", name: "Uploaded", icon: Cloud, count: 0 },
]

export function LibraryContent() {
  const [selectedTab, setSelectedTab] = useState("Playlists")
  const [sortBy, setSortBy] = useState("Date added")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([])

  useEffect(() => {
    setUserPlaylists(getPlaylists())
  }, [])

  const handlePlaylistCreated = () => {
    setUserPlaylists(getPlaylists())
  }

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
            <Button variant="ghost" size="icon">
              <Grid3x3 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Playlists Grid */}
        <div className="px-4 grid grid-cols-2 gap-4">
          {systemPlaylists.map((playlist) => (
            <Link key={playlist.id} href={`/dashboard/playlist/${playlist.id}`}>
              <div className="aspect-square rounded-2xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                <playlist.icon className="w-16 h-16 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mt-2">{playlist.name}</h3>
            </Link>
          ))}

          {userPlaylists.map((playlist) => (
            <Link key={playlist.id} href={`/dashboard/playlist/${playlist.id}`}>
              <div className="aspect-square rounded-2xl bg-secondary overflow-hidden hover:opacity-80 transition-opacity">
                <div className="grid grid-cols-2 h-full">
                  <div className="bg-primary/20" />
                  <div className="bg-primary/30" />
                  <div className="bg-primary/40" />
                  <div className="bg-primary/50" />
                </div>
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
      </div>

      <CreatePlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </>
  )
}
