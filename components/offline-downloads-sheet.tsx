"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Trash2, Play, HardDrive } from "lucide-react"
import { offlineStorage, type OfflineSong } from "@/lib/offline-storage"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"

interface OfflineDownloadsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OfflineDownloadsSheet({ open, onOpenChange }: OfflineDownloadsSheetProps) {
  const { playVideo } = useMusicPlayer()
  const [offlineSongs, setOfflineSongs] = useState<OfflineSong[]>([])
  const [totalSize, setTotalSize] = useState(0)

  useEffect(() => {
    const updateOfflineSongs = () => {
      setOfflineSongs(offlineStorage.getOfflineSongs())
      setTotalSize(offlineStorage.getTotalSize())
    }

    updateOfflineSongs()

    const handleStorageChange = () => {
      updateOfflineSongs()
    }

    window.addEventListener("offlineStorageChanged", handleStorageChange)
    return () => window.removeEventListener("offlineStorageChanged", handleStorageChange)
  }, [])

  const handleRemove = async (songId: string) => {
    await offlineStorage.removeOfflineSong(songId)
  }

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to remove all offline downloads?")) {
      await offlineStorage.clearAllOffline()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <Download className="w-6 h-6" />
            Offline Downloads
          </SheetTitle>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span>
                {offlineSongs.length} songs • {offlineStorage.formatSize(totalSize)}
              </span>
            </div>
            {offlineSongs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-destructive">
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {offlineSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No offline downloads</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Download songs to listen offline without an internet connection
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {offlineSongs.map((song) => (
                <div key={song.id} className="flex items-center gap-3 group">
                  <button
                    type="button"
                    onClick={() =>
                      playVideo({
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        thumbnail: song.thumbnail,
                        duration: song.duration,
                      })
                    }
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={song.thumbnail || "/placeholder.svg"}
                        alt={song.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-6 h-6 fill-white text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="font-semibold truncate">{song.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                      <p className="text-xs text-muted-foreground">{offlineStorage.formatSize(song.size)}</p>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(song.id)}
                    className="flex-shrink-0 text-destructive"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
