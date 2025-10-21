"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import Image from "next/image"
import { getPlaylists, addVideoToPlaylist, type Playlist } from "@/lib/playlist-storage"
import { CreatePlaylistDialog } from "./create-playlist-dialog"
import type { YouTubeVideo } from "@/lib/youtube"

interface AddToPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  video: YouTubeVideo
}

export function AddToPlaylistDialog({ open, onOpenChange, video }: AddToPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (open) {
      setPlaylists(getPlaylists())
    }
  }, [open])

  const handleAddToPlaylist = (playlistId: string) => {
    addVideoToPlaylist(playlistId, video)
    onOpenChange(false)
  }

  const handleCreatePlaylist = () => {
    setShowCreateDialog(true)
    onOpenChange(false)
  }

  const handlePlaylistCreated = () => {
    setPlaylists(getPlaylists())
  }

  const getPlaylistThumbnail = (playlist: Playlist) => {
    const videos = playlist.videos.slice(0, 4)
    if (videos.length === 0) {
      return (
        <div className="w-16 h-16 bg-secondary rounded flex items-center justify-center">
          <span className="text-2xl">🎵</span>
        </div>
      )
    }

    if (videos.length === 1) {
      return (
        <div className="relative w-16 h-16 rounded overflow-hidden">
          <Image src={videos[0].thumbnail || "/placeholder.svg"} alt="" fill className="object-cover" />
        </div>
      )
    }

    return (
      <div className="w-16 h-16 grid grid-cols-2 gap-0.5 rounded overflow-hidden">
        {videos.map((video, i) => (
          <div key={i} className="relative w-full h-full">
            <Image src={video.thumbnail || "/placeholder.svg"} alt="" fill className="object-cover" />
          </div>
        ))}
        {Array.from({ length: 4 - videos.length }).map((_, i) => (
          <div key={`empty-${i}`} className="w-full h-full bg-secondary" />
        ))}
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-secondary/95 backdrop-blur-lg border-secondary">
          <DialogHeader className="sr-only">
            <DialogTitle>Add to playlist</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <button
              onClick={handleCreatePlaylist}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-16 h-16 rounded bg-secondary/50 flex items-center justify-center">
                <Plus className="w-8 h-8" />
              </div>
              <span className="text-lg font-medium">Create playlist</span>
            </button>

            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                {getPlaylistThumbnail(playlist)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base truncate">{playlist.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {playlist.videos.length} {playlist.videos.length === 1 ? "song" : "songs"}
                  </p>
                </div>
              </button>
            ))}

            {playlists.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No playlists yet</p>
                <p className="text-sm">Create your first playlist to get started</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreatePlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </>
  )
}
