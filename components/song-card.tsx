"use client"

import { memo } from "react"
import { Play } from "lucide-react"
import { ProgressiveImage } from "@/components/progressive-image"
import { DownloadIndicatorBadge } from "@/components/download-indicator-badge"

interface SongCardProps {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration?: string
  isDownloaded?: boolean
  onClick: () => void
}

export const SongCard = memo(function SongCard({
  id,
  title,
  artist,
  thumbnail,
  duration,
  isDownloaded = false,
  onClick,
}: SongCardProps) {
  return (
    <div className="cursor-pointer group" onClick={onClick}>
      <div className="relative aspect-square mb-2">
        <ProgressiveImage src={thumbnail} alt={title} rounded="lg" />
        <DownloadIndicatorBadge isDownloaded={isDownloaded} size="sm" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <Play className="w-8 h-8 fill-white text-white" />
        </div>
      </div>
      <h3 className="font-semibold text-sm truncate">{title}</h3>
      <p className="text-xs text-muted-foreground truncate">{artist}</p>
      {duration && <p className="text-xs text-muted-foreground">{duration}</p>}
    </div>
  )
})
