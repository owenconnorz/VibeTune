"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Heart, Radio, ListPlus, Share2, ListMusic, Library, Download, MoreVertical } from "lucide-react"
import Image from "next/image"
import { useMusicPlayer } from "@/components/music-player-provider"
import { AddToPlaylistDialog } from "./add-to-playlist-dialog"

interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
}

interface ArtistMenuProps {
  song?: Song
  artistName?: string
  artistBanner?: string
  onPlayNext?: () => void
  onAddToPlaylist?: () => void
  onShare?: () => void
  onStartRadio?: () => void
  onAddToQueue?: () => void
  onAddToLibrary?: () => void
  onDownload?: () => void
}

export function ArtistMenu({
  song,
  artistName,
  artistBanner,
  onPlayNext,
  onAddToPlaylist,
  onShare,
  onStartRadio,
  onAddToQueue,
  onAddToLibrary,
  onDownload,
}: ArtistMenuProps) {
  const [open, setOpen] = useState(false)
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false)
  const { addToQueue } = useMusicPlayer()

  const handlePlayNext = () => {
    if (song) {
      addToQueue(song)
    }
    onPlayNext?.()
    setOpen(false)
  }

  const handleAddToPlaylist = () => {
    setShowPlaylistDialog(true)
    setOpen(false)
    onAddToPlaylist?.()
  }

  const handleShare = () => {
    if (song) {
      const url = `https://www.youtube.com/watch?v=${song.id}`
      navigator.clipboard.writeText(url)
    }
    onShare?.()
    setOpen(false)
  }

  const handleStartRadio = () => {
    onStartRadio?.()
    setOpen(false)
  }

  const handleAddToQueue = () => {
    if (song) {
      addToQueue(song)
    }
    onAddToQueue?.()
    setOpen(false)
  }

  const handleAddToLibrary = () => {
    onAddToLibrary?.()
    setOpen(false)
  }

  const handleDownload = () => {
    onDownload?.()
    setOpen(false)
  }

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <div className="overflow-y-auto">
            {/* Banner */}
            {artistBanner && (
              <div className="relative w-full h-48">
                <Image src={artistBanner || "/placeholder.svg"} alt={artistName || ""} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
              </div>
            )}

            {/* Current Song Info */}
            {song && (
              <div className="px-6 py-4 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                  <Image src={song.thumbnail || "/placeholder.svg"} alt={song.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Heart className="w-6 h-6" />
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 flex items-center gap-2 rounded-full bg-secondary/50"
                onClick={handlePlayNext}
              >
                <ListPlus className="w-5 h-5" />
                Play next
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex items-center gap-2 rounded-full bg-secondary/50"
                onClick={handleAddToPlaylist}
              >
                <ListMusic className="w-5 h-5" />
                Add to playlist
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex items-center gap-2 rounded-full bg-secondary/50"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
                Share
              </Button>
            </div>

            {/* Menu Items */}
            <div className="px-6 pb-6 space-y-1">
              <button
                onClick={handleStartRadio}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <Radio className="w-6 h-6" />
                <span className="text-base">Start radio</span>
              </button>
              <button
                onClick={handleAddToQueue}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <ListMusic className="w-6 h-6" />
                <span className="text-base">Add to queue</span>
              </button>
              <button
                onClick={handleAddToLibrary}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <Library className="w-6 h-6" />
                <span className="text-base">Add to library</span>
              </button>
              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <Download className="w-6 h-6" />
                <span className="text-base">Download</span>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {song && (
        <AddToPlaylistDialog
          open={showPlaylistDialog}
          onOpenChange={setShowPlaylistDialog}
          video={{
            id: song.id,
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail,
            duration: song.duration,
          }}
        />
      )}
    </>
  )
}
