"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getPlaylists, addVideoToPlaylist, type Playlist } from "@/lib/playlist-storage"
import type { YouTubeVideo } from "@/lib/youtube"

interface AddToPlaylistDialogProps {
  video: YouTubeVideo
  trigger?: React.ReactNode
}

export function AddToPlaylistDialog({ video, trigger }: AddToPlaylistDialogProps) {
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])

  useEffect(() => {
    if (open) {
      setPlaylists(getPlaylists())
    }
  }, [open])

  const handleAddToPlaylist = (playlistId: string) => {
    addVideoToPlaylist(playlistId, video)
    setPlaylists(getPlaylists())
  }

  const isVideoInPlaylist = (playlist: Playlist) => {
    return playlist.videos.some((v) => v.id === video.id)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add to Playlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          <DialogDescription>Choose a playlist to add this song to</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          {playlists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No playlists yet. Create one first!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => {
                const inPlaylist = isVideoInPlaylist(playlist)
                return (
                  <button
                    key={playlist.id}
                    onClick={() => !inPlaylist && handleAddToPlaylist(playlist.id)}
                    disabled={inPlaylist}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-left">
                      <p className="font-medium">{playlist.name}</p>
                      <p className="text-sm text-muted-foreground">{playlist.videos.length} songs</p>
                    </div>
                    {inPlaylist && <Check className="w-5 h-5 text-primary" />}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
