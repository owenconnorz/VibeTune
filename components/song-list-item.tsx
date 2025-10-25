"use client"

import type React from "react"

import { memo } from "react"
import { Play, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgressiveImage } from "@/components/progressive-image"
import { DownloadIndicatorBadge } from "@/components/download-indicator-badge"

interface SongListItemProps {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration?: string
  isDownloaded?: boolean
  onClick: () => void
  onMenuClick?: (e: React.MouseEvent) => void
}

export const SongListItem = memo(function SongListItem({
  id,
  title,
  artist,
  thumbnail,
  duration,
  isDownloaded = false,
  onClick,
  onMenuClick,
}: SongListItemProps) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer" onClick={onClick}>
      <div className="relative w-14 h-14 flex-shrink-0">
        <ProgressiveImage src={thumbnail} alt={title} rounded="lg" />
        <DownloadIndicatorBadge isDownloaded={isDownloaded} size="sm" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <Play className="w-6 h-6 fill-white text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {artist}
          {duration && ` • ${duration}`}
        </p>
      </div>
      {onMenuClick && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onMenuClick(e)
          }}
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
})
