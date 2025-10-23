"use client"

import { useState, useEffect } from "react"
import { Radio, ListPlus, Share2, Heart, MoreVertical, PlayCircle, ListMusic, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMusicPlayer } from "@/components/music-player-provider"
import type { YouTubeVideo } from "@/lib/innertube"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { isLiked } from "@/lib/liked-storage"
import { downloadSong, isDownloaded } from "@/lib/download-storage"

interface SongMenuProps {
  video: YouTubeVideo
  onLikeToggle?: () => void
}

export function SongMenu({ video, onLikeToggle }: SongMenuProps) {
  const { addToQueue, playVideo, queue, toggleLikedSong } = useMusicPlayer()
  const [showMenu, setShowMenu] = useState(false)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)
  const liked = isLiked(video.id)
  const [downloaded, setDownloaded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const checkDownloaded = async () => {
      const isDownloadedStatus = await isDownloaded(video.id)
      setDownloaded(isDownloadedStatus)
    }
    checkDownloaded()
  }, [video.id])

  const handleStartRadio = () => {
    playVideo(video)
    console.log("[v0] Starting radio for:", video.title)
    setShowMenu(false)
  }

  const handlePlayNext = () => {
    const newQueue = [video, ...queue]
    console.log("[v0] Added to play next:", video.title)
    addToQueue(video)
    setShowMenu(false)
  }

  const handleAddToQueue = () => {
    addToQueue(video)
    console.log("[v0] Added to queue:", video.title)
    setShowMenu(false)
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
      navigator.clipboard.writeText(shareUrl)
      alert("Link copied to clipboard!")
    }
    setShowMenu(false)
  }

  const handleLike = () => {
    toggleLikedSong(video)
    onLikeToggle?.()
  }

  const handleAddToPlaylist = () => {
    setShowMenu(false)
    setShowAddToPlaylist(true)
  }

  const handleDownload = async () => {
    if (downloaded) {
      console.log("[v0] Song already downloaded:", video.title)
      setShowMenu(false)
      return
    }

    setDownloading(true)
    console.log("[v0] ===== STARTING DOWNLOAD =====")
    console.log("[v0] Video ID:", video.id)
    console.log("[v0] Title:", video.title)
    console.log("[v0] Artist:", video.artist || "Unknown Artist")

    try {
      const success = await downloadSong(
        video.id,
        video.title,
        video.artist || "Unknown Artist",
        video.thumbnail,
        video.duration,
      )

      console.log("[v0] Download result:", success)

      if (success) {
        setDownloaded(true)
        console.log("[v0] ===== DOWNLOAD SUCCESSFUL =====")
        // Show success message
        const message = "Song downloaded! Saved to your Downloads folder and available offline in the app."
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("Download Complete", {
            body: `${video.title} is now available offline`,
            icon: video.thumbnail,
          })
        } else {
          alert(message)
        }
      } else {
        console.error("[v0] ===== DOWNLOAD FAILED =====")
        alert("Failed to download song. Please check your internet connection and try again.")
      }
    } catch (error) {
      console.error("[v0] ===== DOWNLOAD ERROR =====")
      console.error("[v0] Error:", error)
      alert("An error occurred while downloading. Please try again.")
    } finally {
      setDownloading(false)
      setShowMenu(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => setShowMenu(true)}>
        <MoreVertical className="w-5 h-5" />
      </Button>

      <Sheet open={showMenu} onOpenChange={setShowMenu}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Song Options</SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {video.thumbnail && (
                <img
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-base truncate">{video.title}</p>
              <p className="text-sm text-muted-foreground truncate">{video.artist || "Unknown Artist"}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                handleLike()
              }}
            >
              <Heart className={`w-6 h-6 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>

          <div className="p-4 space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-4 h-14 text-base" onClick={handleStartRadio}>
              <Radio className="w-6 h-6" />
              <span>Start radio</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-4 h-14 text-base" onClick={handlePlayNext}>
              <PlayCircle className="w-6 h-6" />
              <span>Play next</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-4 h-14 text-base" onClick={handleAddToQueue}>
              <ListMusic className="w-6 h-6" />
              <span>Add to queue</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-4 h-14 text-base" onClick={handleAddToPlaylist}>
              <ListPlus className="w-6 h-6" />
              <span>Add to playlist</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-4 h-14 text-base"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="w-6 h-6" />
              <span>{downloading ? "Downloading..." : downloaded ? "Downloaded" : "Download"}</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-4 h-14 text-base" onClick={handleShare}>
              <Share2 className="w-6 h-6" />
              <span>Share</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AddToPlaylistDialog open={showAddToPlaylist} onOpenChange={setShowAddToPlaylist} video={video} />
    </>
  )
}
