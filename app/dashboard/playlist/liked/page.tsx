"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Play, ShuffleIcon, Heart, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getLikedSongs } from "@/lib/liked-storage"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import type { YouTubeVideo } from "@/lib/youtube"

export default function LikedSongsPage() {
  const router = useRouter()
  const { playVideo, toggleLikedSong } = useMusicPlayer()
  const [likedSongs, setLikedSongs] = useState<YouTubeVideo[]>([])

  useEffect(() => {
    setLikedSongs(getLikedSongs())
  }, [])

  const handlePlay = () => {
    if (likedSongs.length > 0) {
      playVideo(likedSongs[0])
    }
  }

  const handleShuffle = () => {
    if (likedSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * likedSongs.length)
      playVideo(likedSongs[randomIndex])
    }
  }

  const handleUnlike = (video: YouTubeVideo, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleLikedSong(video)
    setLikedSongs(getLikedSongs())
  }

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getTotalDuration = () => {
    const total = likedSongs.reduce((acc, video) => acc + (video.duration || 0), 0)
    return formatDuration(total)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Button variant="ghost" size="icon">
          <Search className="w-6 h-6" />
        </Button>
      </div>

      {/* Playlist Info */}
      <div className="p-6 space-y-6">
        {/* Heart Icon */}
        <div className="w-64 h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-red-500 to-pink-500 mx-auto flex items-center justify-center">
          <Heart className="w-32 h-32 text-white fill-white" />
        </div>

        {/* Playlist Details */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Liked Songs</h1>
          <p className="text-lg text-muted-foreground">{likedSongs.length} songs</p>
          <p className="text-lg text-muted-foreground">{getTotalDuration()}</p>
        </div>

        {/* Play and Shuffle Buttons */}
        <div className="flex gap-4">
          <Button
            className="flex-1 h-14 rounded-full text-lg font-semibold bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2))]/90 text-black"
            onClick={handlePlay}
            disabled={likedSongs.length === 0}
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Play
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-full text-lg font-semibold bg-transparent"
            onClick={handleShuffle}
            disabled={likedSongs.length === 0}
          >
            <ShuffleIcon className="w-5 h-5 mr-2" />
            Shuffle
          </Button>
        </div>

        {/* Song List */}
        {likedSongs.length > 0 ? (
          <div className="space-y-2 pb-32">
            {likedSongs.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => playVideo(video)}
              >
                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-secondary">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{video.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{video.artist}</p>
                </div>

                {/* Duration, Heart & Menu */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {video.duration && (
                    <span className="text-sm text-muted-foreground">{formatDuration(video.duration)}</span>
                  )}
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => handleUnlike(video, e)}>
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No liked songs yet</p>
            <p className="text-muted-foreground text-sm mt-2">Like songs to see them here</p>
          </div>
        )}
      </div>
    </div>
  )
}
