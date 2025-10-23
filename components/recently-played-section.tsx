"use client"

import { useState, useEffect } from "react"
import { Play, Clock } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMusicPlayer } from "@/components/music-player-provider"
import { historyStorage, type HistoryVideo } from "@/lib/history-storage"
import Image from "next/image"

export function RecentlyPlayedSection() {
  const { playVideo } = useMusicPlayer()
  const [recentlyPlayed, setRecentlyPlayed] = useState<HistoryVideo[]>([])

  useEffect(() => {
    // Load initial history
    setRecentlyPlayed(historyStorage.getHistory().slice(0, 20))

    // Listen for history updates
    const handleStorageChange = () => {
      setRecentlyPlayed(historyStorage.getHistory().slice(0, 20))
    }

    window.addEventListener("storage", handleStorageChange)

    // Custom event for same-tab updates
    const handleHistoryUpdate = () => {
      setRecentlyPlayed(historyStorage.getHistory().slice(0, 20))
    }

    window.addEventListener("historyUpdated", handleHistoryUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("historyUpdated", handleHistoryUpdate)
    }
  }, [])

  if (recentlyPlayed.length === 0) {
    return null
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return `${Math.floor(seconds / 604800)}w ago`
  }

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5" />
        <h2 className="text-2xl font-bold">Recently Played</h2>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          {recentlyPlayed.map((song) => (
            <div
              key={`${song.id}-${song.playedAt}`}
              className="w-40 flex-shrink-0 cursor-pointer group"
              onClick={() =>
                playVideo({
                  id: song.id,
                  title: song.title,
                  artist: song.channelTitle,
                  thumbnail: song.thumbnail,
                  duration: song.duration,
                })
              }
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                <Image src={song.thumbnail || "/placeholder.svg"} alt={song.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-8 h-8 fill-white text-white" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {formatTimeAgo(song.playedAt)}
                </div>
              </div>
              <h3 className="font-semibold text-sm truncate">{song.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{song.channelTitle}</p>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
