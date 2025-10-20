"use client"

import { useState, useEffect } from "react"
import { Trash2, Play } from "lucide-react"
import { Header } from "@/components/header"
import { MusicPlayer } from "@/components/music-player"
import { PlaylistDialog } from "@/components/playlist-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPlaylists, deletePlaylist, removeVideoFromPlaylist, type Playlist } from "@/lib/playlist-storage"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const { playVideo } = useMusicPlayer()

  useEffect(() => {
    setPlaylists(getPlaylists())
  }, [])

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylist(id)
      setPlaylists(getPlaylists())
    }
  }

  const handleRemoveVideo = (playlistId: string, videoId: string) => {
    removeVideoFromPlaylist(playlistId, videoId)
    setPlaylists(getPlaylists())
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header user={{ name: "User", email: "user@example.com" }} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Playlists</h1>
            <p className="text-muted-foreground">Manage and organize your music collections</p>
          </div>
          <PlaylistDialog onPlaylistCreated={() => setPlaylists(getPlaylists())} />
        </div>

        {playlists.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
            <p className="text-muted-foreground mb-6">Create your first playlist to start organizing your music</p>
            <PlaylistDialog onPlaylistCreated={() => setPlaylists(getPlaylists())} />
          </Card>
        ) : (
          <div className="space-y-6">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{playlist.name}</h2>
                    {playlist.description && <p className="text-muted-foreground">{playlist.description}</p>}
                    <p className="text-sm text-muted-foreground mt-2">{playlist.videos.length} songs</p>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(playlist.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {playlist.videos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No songs in this playlist yet. Search for music to add!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {playlist.videos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                      >
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{video.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">{video.artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{video.duration}</span>
                          <Button variant="ghost" size="icon" onClick={() => playVideo(video)}>
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveVideo(playlist.id, video.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
      <MusicPlayer />
    </div>
  )
}
