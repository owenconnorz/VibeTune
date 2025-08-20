"use client"

import type React from "react"
import { useState } from "react"
import { useDownload } from "@/contexts/download-context"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download, Check, Pause, Play, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DownloadButtonProps {
  song: {
    id: string
    title: string
    artist: string
    thumbnail?: string
    url?: string
  }
  variant?: "default" | "outline" | "ghost" | "icon"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showProgress?: boolean
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  song,
  variant = "ghost",
  size = "icon",
  className,
  showProgress = false,
}) => {
  const { downloadSong, isDownloaded, getDownloadProgress, downloads, pauseDownload, resumeDownload, cancelDownload } =
    useDownload()
  const [isHovered, setIsHovered] = useState(false)

  const currentDownload = downloads.find((d) => d.id === song.id)
  const progress = getDownloadProgress(song.id)
  const downloaded = isDownloaded(song.id)

  const handleDownload = async () => {
    if (downloaded) return
    if (currentDownload?.status === "downloading") {
      pauseDownload(song.id)
    } else if (currentDownload?.status === "paused") {
      resumeDownload(song.id)
    } else if (currentDownload) {
      cancelDownload(song.id)
    } else {
      await downloadSong(song)
    }
  }

  const getIcon = () => {
    if (downloaded) return <Check className="h-4 w-4" />
    if (currentDownload?.status === "downloading") return <Pause className="h-4 w-4" />
    if (currentDownload?.status === "paused") return <Play className="h-4 w-4" />
    if (currentDownload?.status === "failed") return <X className="h-4 w-4" />
    return <Download className="h-4 w-4" />
  }

  const getTooltip = () => {
    if (downloaded) return "Downloaded"
    if (currentDownload?.status === "downloading") return "Pause download"
    if (currentDownload?.status === "paused") return "Resume download"
    if (currentDownload?.status === "failed") return "Download failed - retry"
    return "Download"
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative",
          downloaded && "text-green-500 hover:text-green-600",
          currentDownload?.status === "failed" && "text-red-500 hover:text-red-600",
        )}
        title={getTooltip()}
        disabled={currentDownload?.status === "pending"}
      >
        {getIcon()}
      </Button>

      {showProgress && currentDownload && !downloaded && (
        <div className="absolute -bottom-1 left-0 right-0 px-1">
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {isHovered && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {getTooltip()}
        </div>
      )}
    </div>
  )
}
