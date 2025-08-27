"use client"

import { Music, Video } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlaylistThumbnailGridProps {
  songs: any[]
  className?: string
  fallbackThumbnail?: string
}

export function PlaylistThumbnailGrid({
  songs,
  className,
  fallbackThumbnail = "/music-playlist-concept.png",
}: PlaylistThumbnailGridProps) {
  // Filter for songs with thumbnails, prioritizing videos
  const songsWithThumbnails = songs.filter((song) => song.thumbnail)
  const videoSongs = songsWithThumbnails.filter(
    (song) => song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_"),
  )
  const regularSongs = songsWithThumbnails.filter(
    (song) => !(song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_")),
  )

  // Prioritize videos, then regular songs, take first 4
  const displaySongs = [...videoSongs, ...regularSongs].slice(0, 4)

  // If we have 4 or more songs with thumbnails, show grid
  if (displaySongs.length >= 4) {
    return (
      <div className={cn("aspect-square grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden", className)}>
        {displaySongs.slice(0, 4).map((song, index) => (
          <div key={`${song.id}-${index}`} className="relative aspect-square bg-zinc-700 overflow-hidden">
            <img
              src={song.thumbnail || "/placeholder.svg"}
              alt={song.title || "Song"}
              className="w-full h-full object-cover"
            />
            {(song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_")) && (
              <div className="absolute bottom-0 right-0 bg-black/70 text-white p-0.5 rounded-tl">
                <Video className="w-2 h-2" />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // If we have 2-3 songs, show a partial grid with fallback
  if (displaySongs.length >= 2) {
    const fillCount = 4 - displaySongs.length
    return (
      <div className={cn("aspect-square grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden", className)}>
        {displaySongs.map((song, index) => (
          <div key={`${song.id}-${index}`} className="relative aspect-square bg-zinc-700 overflow-hidden">
            <img
              src={song.thumbnail || "/placeholder.svg"}
              alt={song.title || "Song"}
              className="w-full h-full object-cover"
            />
            {(song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_")) && (
              <div className="absolute bottom-0 right-0 bg-black/70 text-white p-0.5 rounded-tl">
                <Video className="w-2 h-2" />
              </div>
            )}
          </div>
        ))}
        {Array.from({ length: fillCount }).map((_, index) => (
          <div key={`fallback-${index}`} className="aspect-square bg-zinc-700 flex items-center justify-center">
            <Music className="w-4 h-4 text-gray-500" />
          </div>
        ))}
      </div>
    )
  }

  // If we have 1 song, show single thumbnail
  if (displaySongs.length === 1) {
    const song = displaySongs[0]
    return (
      <div className={cn("aspect-square rounded-xl overflow-hidden bg-zinc-700 relative", className)}>
        <img
          src={song.thumbnail || "/placeholder.svg"}
          alt={song.title || "Song"}
          className="w-full h-full object-cover"
        />
        {(song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_")) && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white p-1 rounded">
            <Video className="w-3 h-3" />
          </div>
        )}
      </div>
    )
  }

  // Fallback to default thumbnail or gradient
  return (
    <div className={cn("aspect-square rounded-xl overflow-hidden", className)}>
      {fallbackThumbnail ? (
        <img src={fallbackThumbnail || "/placeholder.svg"} alt="Playlist" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Music className="w-10 h-10 text-white" />
        </div>
      )}
    </div>
  )
}
