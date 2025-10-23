"use client"

import { useState, useEffect } from "react"
import { Volume2, Radio, ListPlus, Link2, User, Disc3, Download, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { AddToPlaylistDialog } from "./add-to-playlist-dialog"
import { downloadSong, isDownloaded, deleteSong } from "@/lib/download-storage"

interface NowPlayingMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  volume: number
  setVolume: (volume: number) => void
  currentVideo: {
    id: string
    title: string
    artist: string
    thumbnail?: string
    duration?: string | number
  } | null
}

export function NowPlayingMenu({ open, onOpenChange, volume, setVolume, currentVideo }: NowPlayingMenuProps) {
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    if (currentVideo) {
      isDownloaded(currentVideo.id).then(setDownloaded)
    }
  }, [currentVideo])

  const handleCopyLink = () => {
    if (currentVideo) {
      const link = `https://youtube.com/watch?v=${currentVideo.id}`
      navigator.clipboard.writeText(link)
      onOpenChange(false)
    }
  }

  const handleStartRadio = () => {
    console.log("[v0] Start radio for:", currentVideo?.title)
    onOpenChange(false)
  }

  const handleAddToPlaylist = () => {
    setShowPlaylistDialog(true)
  }

  const handleViewArtist = () => {
    console.log("[v0] View artist:", currentVideo?.artist)
    onOpenChange(false)
  }

  const handleViewAlbum = () => {
    console.log("[v0] View album for:", currentVideo?.title)
    onOpenChange(false)
  }

  const handleDownload = async () => {
    if (!currentVideo || isDownloading) return

    try {
      setIsDownloading(true)

      if (downloaded) {
        // Delete from offline storage
        console.log("[v0] Removing from offline storage:", currentVideo.title)
        const success = await deleteSong(currentVideo.id)
        if (success) {
          setDownloaded(false)
          console.log("[v0] Removed from offline storage successfully")
        }
      } else {
        // Download for offline playback
        console.log("[v0] Downloading for offline playback:", currentVideo.title)
        const success = await downloadSong(
          currentVideo.id,
          currentVideo.title,
          currentVideo.artist,
          currentVideo.thumbnail || "",
          currentVideo.duration || "0:00",
        )

        if (success) {
          setDownloaded(true)
          console.log("[v0] Downloaded successfully for offline playback")
        } else {
          alert("Failed to download for offline playback. Please try again.")
        }
      }

      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Download operation failed:", error)
      alert("Failed to download. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Song Options</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 pt-2">
            <div className="flex items-center gap-3 mb-6">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
                className="flex-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 rounded-2xl bg-transparent"
                onClick={handleStartRadio}
              >
                <Radio className="w-5 h-5" />
                <span className="text-xs">Start radio</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 rounded-2xl bg-transparent"
                onClick={handleAddToPlaylist}
              >
                <ListPlus className="w-5 h-5" />
                <span className="text-xs">Add to playlist</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 rounded-2xl bg-transparent"
                onClick={handleCopyLink}
              >
                <Link2 className="w-5 h-5" />
                <span className="text-xs">Copy link</span>
              </Button>
            </div>

            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={handleViewArtist}>
                <User className="w-5 h-5" />
                <span>View artist</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={handleViewAlbum}>
                <Disc3 className="w-5 h-5" />
                <span>View album</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                <span>{isDownloading ? "Processing..." : downloaded ? "Remove from offline" : "Save for offline"}</span>
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {currentVideo && (
        <AddToPlaylistDialog
          open={showPlaylistDialog}
          onOpenChange={setShowPlaylistDialog}
          video={{
            id: currentVideo.id,
            title: currentVideo.title,
            artist: currentVideo.artist,
            thumbnail: currentVideo.thumbnail || "",
            duration: currentVideo.duration || "",
          }}
        />
      )}
    </>
  )
}
