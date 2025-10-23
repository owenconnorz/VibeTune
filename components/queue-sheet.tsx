"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import { X, GripVertical, Play, Save } from "lucide-react"
import Image from "next/image"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import type { YouTubeVideo } from "@/lib/innertube"

interface QueueSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QueueSheet({ open, onOpenChange }: QueueSheetProps) {
  const { queue, currentVideo, removeFromQueue, reorderQueue, clearQueue, playVideo } = useMusicPlayer()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false)
  const [playlistSongs, setPlaylistSongs] = useState<YouTubeVideo[]>([])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    reorderQueue(draggedIndex, index)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSaveAsPlaylist = () => {
    setPlaylistSongs(queue)
    setCreatePlaylistOpen(true)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">Queue</SheetTitle>
              <div className="flex items-center gap-2">
                {queue.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleSaveAsPlaylist}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearQueue}>
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
            {queue.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {queue.length} {queue.length === 1 ? "song" : "songs"} in queue
              </p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {currentVideo && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Now Playing</h3>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={currentVideo.thumbnail || "/placeholder.svg"}
                      alt={currentVideo.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{currentVideo.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{currentVideo.artist}</p>
                  </div>
                  <Play className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
              </div>
            )}

            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Queue is empty</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Add songs to your queue to see them here. They'll play after the current song.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Up Next</h3>
                {queue.map((video, index) => (
                  <div
                    key={`${video.id}-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group ${
                      draggedIndex === index ? "opacity-50" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="cursor-grab active:cursor-grabbing touch-none"
                      onTouchStart={(e) => e.preventDefault()}
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playVideo(video)
                        removeFromQueue(index)
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="font-medium text-sm line-clamp-1">{video.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{video.artist}</p>
                    </button>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDuration(video.duration)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => removeFromQueue(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CreatePlaylistDialog
        open={createPlaylistOpen}
        onOpenChange={setCreatePlaylistOpen}
        initialSongs={playlistSongs}
      />
    </>
  )
}
