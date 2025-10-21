"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Search,
  Trash2,
  Pencil,
  ShuffleIcon,
  Download,
  ListOrdered,
  Lock,
  Play,
  MoreVertical,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getPlaylists, deletePlaylist, type Playlist } from "@/lib/playlist-storage"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { isLiked } from "@/lib/liked-storage"

interface PlaylistContentProps {
  playlistId: string
}

export function PlaylistContent({ playlistId }: PlaylistContentProps) {
  const router = useRouter()
  const { playVideo, toggleLikedSong } = useMusicPlayer()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [likedStates, setLikedStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const playlists = getPlaylists()
    const found = playlists.find((p) => p.id === playlistId)
    setPlaylist(found || null)

    if (found) {
      const states: Record<string, boolean> = {}
      found.videos.forEach((video) => {
        states[video.id] = isLiked(video.id)
      })
      setLikedStates(states)
    }
  }, [playlistId])

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylist(playlistId)
      router.push("/dashboard/library")
    }
  }

  const handlePlay = () => {
    if (playlist && playlist.videos.length > 0) {
      playVideo(playlist.videos[0])
    }
  }

  const handleShuffle = () => {
    if (playlist && playlist.videos.length > 0) {
      const randomIndex = Math.floor(Math.random() * playlist.videos.length)
      playVideo(playlist.videos[randomIndex])
    }
  }

  const handleLikeToggle = (video: any, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleLikedSong(video)
    setLikedStates((prev) => ({
      ...prev,
      [video.id]: !prev[video.id],
    }))
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
    if (!playlist) return "0:00"
    const total = playlist.videos.reduce((acc, video) => {
      return acc + (video.duration || 0)
    }, 0)
    return formatDuration(total)
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Playlist not found</p>
      </div>
    )
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
        {/* Thumbnail Grid */}
        <div className="w-64 h-64 rounded-2xl overflow-hidden bg-secondary mx-auto">
          <div className="grid grid-cols-2 h-full">
            {playlist.videos.slice(0, 4).map((video, index) => (
              <div
                key={video.id}
                className="relative bg-cover bg-center"
                style={{
                  backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : "none",
                  backgroundColor: !video.thumbnail ? `hsl(var(--primary) / ${0.2 + index * 0.1})` : undefined,
                }}
              />
            ))}
            {Array.from({ length: Math.max(0, 4 - playlist.videos.length) }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="bg-secondary"
                style={{ backgroundColor: `hsl(var(--primary) / ${0.2 + (playlist.videos.length + index) * 0.1})` }}
              />
            ))}
          </div>
        </div>

        {/* Playlist Details */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{playlist.name}</h1>
          <p className="text-lg text-muted-foreground">{playlist.videos.length} songs</p>
          <p className="text-lg text-muted-foreground">{getTotalDuration()}</p>
        </div>

        {/* Action Icons */}
        <div className="flex items-center justify-center gap-6">
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Pencil className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShuffle}>
            <ShuffleIcon className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <ListOrdered className="w-6 h-6" />
          </Button>
        </div>

        {/* Play and Shuffle Buttons */}
        <div className="flex gap-4">
          <Button
            className="flex-1 h-14 rounded-full text-lg font-semibold bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2))]/90 text-black"
            onClick={handlePlay}
            disabled={playlist.videos.length === 0}
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Play
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-full text-lg font-semibold bg-transparent"
            onClick={handleShuffle}
            disabled={playlist.videos.length === 0}
          >
            <ShuffleIcon className="w-5 h-5 mr-2" />
            Shuffle
          </Button>
        </div>

        {/* Sort Section */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            className="gap-2 text-[hsl(var(--chart-2))] hover:text-[hsl(var(--chart-2))]/80"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            Date added
            <svg
              className={`w-4 h-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </Button>
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Song List Rendering */}
        {playlist.videos.length > 0 ? (
          <div className="space-y-2 pb-32">
            {playlist.videos.map((video, index) => (
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
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => handleLikeToggle(video, e)}>
                    <Heart className={`w-4 h-4 ${likedStates[video.id] ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Open song menu
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No songs in this playlist yet</p>
            <p className="text-muted-foreground text-sm mt-2">Add songs to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
