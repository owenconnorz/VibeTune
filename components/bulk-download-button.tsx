"use client"

import type React from "react"
import { useState } from "react"
import { useDownload } from "@/contexts/download-context"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

interface BulkDownloadButtonProps {
  songs: Array<{
    id: string
    title: string
    artist: string
    thumbnail?: string
    url?: string
  }>
  label?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export const BulkDownloadButton: React.FC<BulkDownloadButtonProps> = ({
  songs,
  label = "Download All",
  variant = "outline",
  size = "default",
  className,
}) => {
  const { downloadSong, isDownloading } = useDownload()
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)

  const handleBulkDownload = async () => {
    if (songs.length === 0) return

    setIsBulkDownloading(true)
    console.log("[v0] Starting bulk download of", songs.length, "songs")

    try {
      // Download songs sequentially to avoid overwhelming the system
      for (const song of songs) {
        await downloadSong(song)
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error("[v0] Bulk download failed:", error)
    } finally {
      setIsBulkDownloading(false)
    }
  }

  const isDisabled = isBulkDownloading || isDownloading || songs.length === 0

  return (
    <Button variant={variant} size={size} onClick={handleBulkDownload} disabled={isDisabled} className={className}>
      {isBulkDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      {isBulkDownloading ? `Downloading... (${songs.length})` : `${label} (${songs.length})`}
    </Button>
  )
}
