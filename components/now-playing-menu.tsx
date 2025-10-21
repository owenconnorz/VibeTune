"use client"

import { useState } from "react"
import { Volume2, Radio, ListPlus, Link2, User, Disc3, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { AddToPlaylistDialog } from "./add-to-playlist-dialog"

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
  } | null
}

export function NowPlayingMenu({ open, onOpenChange, volume, setVolume, currentVideo }: NowPlayingMenuProps) {
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

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
      console.log("[v0] Starting download for:", currentVideo.title)

      // Fetch the audio stream URL
      const response = await fetch(`/api/video/${currentVideo.id}/stream`)
      if (!response.ok) {
        throw new Error("Failed to fetch audio stream")
      }

      const data = await response.json()
      if (!data.audioUrl) {
        throw new Error("No audio URL available")
      }

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a")
      link.href = data.audioUrl
      link.download = `${currentVideo.title} - ${currentVideo.artist}.mp3`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("[v0] Download started successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Download failed:", error)
      alert("Failed to download audio. Please try again.")
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
                <Download className="w-5 h-5" />
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
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
            duration: "",
          }}
        />
      )}
    </>
  )
}
