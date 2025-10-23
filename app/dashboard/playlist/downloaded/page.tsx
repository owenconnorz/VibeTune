"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useMusicPlayer } from "@/components/music-player-provider"
import {
  getAllDownloadedSongs,
  deleteSong,
  getTotalStorageSize,
  formatBytes,
  type DownloadedSong,
} from "@/lib/download-storage"
import { MiniPlayer } from "@/components/mini-player"

export default function DownloadedPlaylistPage() {
  const router = useRouter()
  const { playVideo, currentVideo } = useMusicPlayer()
  const [songs, setSongs] = useState<DownloadedSong[]>([])
  const [storageSize, setStorageSize] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDownloadedSongs()
  }, [])

  const loadDownloadedSongs = async () => {
    setLoading(true)
    const downloadedSongs = await getAllDownloadedSongs()
    const totalSize = await getTotalStorageSize()
    setSongs(downloadedSongs)
    setStorageSize(totalSize)
    setLoading(false)
  }

  const handlePlaySong = (song: DownloadedSong, index: number) => {
    const remainingSongs = songs.slice(index + 1).map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      duration: s.duration,
    }))

    playVideo(
      {
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        duration: song.duration,
      },
      remainingSongs,
    )
  }

  const handleDeleteSong = async (songId: string) => {
    const success = await deleteSong(songId)
    if (success) {
      await loadDownloadedSongs()
    }
  }

  const parseDuration = (duration: string | number): number => {
    if (typeof duration === "number") return duration
    const parts = duration.split(":").map(Number)
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0
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

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Downloaded</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">{songs.length} songs</p>
            <p className="text-xs text-muted-foreground">Storage: {formatBytes(storageSize)}</p>
          </div>
          {songs.length > 0 && (
            <Button onClick={() => handlePlaySong(songs[0], 0)} className="rounded-full gap-2">
              <Play className="w-4 h-4 fill-current" />
              Play all
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No downloaded songs</p>
            <p className="text-sm mt-2">Download songs for offline playback</p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => {
              const isPlaying = currentVideo?.id === song.id
              const durationSeconds = parseDuration(song.duration)

              return (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors ${
                    isPlaying ? "bg-secondary/50" : ""
                  }`}
                  onClick={() => handlePlaySong(song, index)}
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={song.thumbnail || "/placeholder.svg"}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isPlaying ? "text-primary" : ""}`}>{song.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate">{song.artist}</span>
                      {durationSeconds > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex-shrink-0">{formatDuration(durationSeconds)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSong(song.id)
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <MiniPlayer />
    </div>
  )
}
