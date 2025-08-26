"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Music, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePlaylist } from "@/contexts/playlist-context"
import type { Song } from "@/lib/music-data"

interface AddToPlaylistDialogProps {
  songs: Song[]
  trigger?: React.ReactNode
  isAddAll?: boolean
  navigateToPlaylist?: boolean
}

export function AddToPlaylistDialog({
  songs,
  trigger,
  isAddAll = false,
  navigateToPlaylist = false,
}: AddToPlaylistDialogProps) {
  const { playlists, createPlaylist, addSongToPlaylist, addAllSongsToPlaylist } = usePlaylist()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("")
  const [addedToPlaylists, setAddedToPlaylists] = useState<Set<string>>(new Set())

  const handleAddToPlaylist = (playlistId: string) => {
    if (isAddAll) {
      addAllSongsToPlaylist(playlistId, songs)
    } else {
      songs.forEach((song) => addSongToPlaylist(playlistId, song))
    }
    setAddedToPlaylists((prev) => new Set([...prev, playlistId]))

    if (navigateToPlaylist) {
      setTimeout(() => {
        setIsOpen(false)
        router.push(`/library/playlist/${playlistId}`)
      }, 1000)
    } else {
      setTimeout(() => {
        setAddedToPlaylists((prev) => {
          const newSet = new Set(prev)
          newSet.delete(playlistId)
          return newSet
        })
      }, 2000)
    }
  }

  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle.trim()) return

    const newPlaylist = createPlaylist(newPlaylistTitle.trim())
    handleAddToPlaylist(newPlaylist.id)
    setNewPlaylistTitle("")
    setIsCreating(false)
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
      <Plus className="w-4 h-4" />
      {isAddAll ? "Add All to Playlist" : "Add to Playlist"}
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>{isAddAll ? `Add ${songs.length} songs to playlist` : "Add to playlist"}</DialogTitle>
          <DialogDescription className="text-zinc-400">Choose a playlist or create a new one</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isCreating ? (
            <div className="space-y-3 p-4 bg-zinc-800 rounded-lg">
              <Label htmlFor="playlist-title">Playlist name</Label>
              <Input
                id="playlist-title"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                placeholder="Enter playlist name"
                className="bg-zinc-700 border-zinc-600"
                onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreatePlaylist} size="sm">
                  Create & Add
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)} size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="w-full justify-start gap-2 border-zinc-600 hover:bg-zinc-800"
            >
              <Plus className="w-4 h-4" />
              Create new playlist
            </Button>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {playlists.map((playlist) => (
              <Button
                key={playlist.id}
                variant="ghost"
                onClick={() => handleAddToPlaylist(playlist.id)}
                className="w-full justify-start gap-3 h-auto p-3 hover:bg-zinc-800"
                disabled={addedToPlaylists.has(playlist.id)}
              >
                <div className="w-10 h-10 bg-zinc-700 rounded flex items-center justify-center flex-shrink-0">
                  {addedToPlaylists.has(playlist.id) ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Music className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{playlist.title}</div>
                  <div className="text-sm text-zinc-400">{playlist.songs.length} songs</div>
                </div>
                <div className="flex items-center gap-2">
                  {addedToPlaylists.has(playlist.id) && (
                    <span className="text-sm text-green-500">{navigateToPlaylist ? "Opening..." : "Added!"}</span>
                  )}
                  {navigateToPlaylist && !addedToPlaylists.has(playlist.id) && (
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          {playlists.length === 0 && !isCreating && (
            <div className="text-center py-8 text-zinc-400">
              <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No playlists yet</p>
              <p className="text-sm">Create your first playlist above</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
