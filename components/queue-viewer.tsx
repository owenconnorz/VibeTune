"use client"

import type React from "react"

import { useState } from "react"
import { X, GripVertical, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import type { YouTubeVideo } from "@/lib/innertube"

interface QueueViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QueueViewer({ open, onOpenChange }: QueueViewerProps) {
  const { queue, currentVideo, playVideo, removeFromQueue, reorderQueue, clearQueue } = useMusicPlayer()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    reorderQueue(draggedIndex, dropIndex)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handlePlayFromQueue = (video: YouTubeVideo, index: number) => {
    const remainingQueue = queue.slice(index + 1)
    playVideo(video, remainingQueue)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle>Queue ({queue.length} songs)</SheetTitle>
            {queue.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearQueue}>
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        {currentVideo && (
          <div className="flex-shrink-0 p-4 bg-muted/50 rounded-lg mb-4">
            <p className="text-xs text-muted-foreground mb-2">Now Playing</p>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={currentVideo.thumbnail || "/placeholder.svg"}
                  alt={currentVideo.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentVideo.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentVideo.artist}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Queue is empty</h3>
              <p className="text-sm text-muted-foreground">Add songs to your queue to see them here</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-4 mb-2">Up Next</p>
              {queue.map((video, index) => (
                <div
                  key={`${video.id}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                    dragOverIndex === index ? "bg-muted" : ""
                  } ${draggedIndex === index ? "opacity-50" : ""}`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>

                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handlePlayFromQueue(video, index)}
                  >
                    <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{video.artist}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{video.duration}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromQueue(index)
                    }}
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
  )
}
