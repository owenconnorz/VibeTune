"use client"

import { Volume2, Radio, ListPlus, Link2, User, Disc3, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

interface NowPlayingMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  volume: number
  setVolume: (volume: number) => void
  currentVideo: {
    id: string
    title: string
    artist: string
  } | null
}

export function NowPlayingMenu({ open, onOpenChange, volume, setVolume, currentVideo }: NowPlayingMenuProps) {
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
    console.log("[v0] Add to playlist:", currentVideo?.title)
    onOpenChange(false)
  }

  const handleViewArtist = () => {
    console.log("[v0] View artist:", currentVideo?.artist)
    onOpenChange(false)
  }

  const handleViewAlbum = () => {
    console.log("[v0] View album for:", currentVideo?.title)
    onOpenChange(false)
  }

  const handleDownload = () => {
    console.log("[v0] Download:", currentVideo?.title)
    onOpenChange(false)
  }

  return (
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
            <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={handleDownload}>
              <Download className="w-5 h-5" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
