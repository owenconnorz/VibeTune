"use client"

import { useState } from "react"
import { Radio, ListPlus, Share2, Heart, MoreVertical, PlayCircle, ListMusic } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMusicPlayer } from "@/components/music-player-provider"
import type { YouTubeVideo } from "@/lib/innertube"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { isLiked } from "@/lib/liked-storage"

interface SongMenuProps {
  video: YouTubeVideo
  onLikeToggle?: () => void
}

export function SongMenu({ video, onLikeToggle }: SongMenuProps) {
  const { addToQueue, playVideo, queue, toggleLikedSong } = useMusicPlayer()
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)
  const liked = isLiked(video.id)

  const handleStartRadio = () => {
    playVideo(video)
    console.log("[v0] Starting radio for:", video.title)
  }

  const handlePlayNext = () => {
    const newQueue = [video, ...queue]
    console.log("[v0] Added to play next:", video.title)
    addToQueue(video)
  }

  const handleAddToQueue = () => {
    addToQueue(video)
    console.log("[v0] Added to queue:", video.title)
  }

  const handleShare = async () => {
    const shareUrl = `https://music.youtube.com/watch?v=${video.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Check out ${video.title} by ${video.artist || "Unknown Artist"}`,
          url: shareUrl,
        })
      } catch (error) {
        console.log("[v0] Share cancelled or failed:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl)
      alert("Link copied to clipboard!")
    }
  }

  const handleLike = () => {
    toggleLikedSong(video)
    onLikeToggle?.()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-9 h-9">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                {video.thumbnail && (
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{video.title}</p>
                <p className="text-xs text-muted-foreground truncate">{video.artist || "Unknown Artist"}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleLike()
                }}
              >
                <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="p-2">
            <DropdownMenuItem onClick={handleStartRadio} className="gap-3 py-3">
              <Radio className="w-5 h-5" />
              <span>Start radio</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handlePlayNext} className="gap-3 py-3">
              <PlayCircle className="w-5 h-5" />
              <span>Play next</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleAddToQueue} className="gap-3 py-3">
              <ListMusic className="w-5 h-5" />
              <span>Add to queue</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setShowAddToPlaylist(true)} className="gap-3 py-3">
              <ListPlus className="w-5 h-5" />
              <span>Add to playlist</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleShare} className="gap-3 py-3">
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddToPlaylistDialog open={showAddToPlaylist} onOpenChange={setShowAddToPlaylist} video={video} />
    </>
  )
}
