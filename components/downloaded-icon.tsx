"use client"

import { Check } from "lucide-react"
import { useDownload } from "@/contexts/download-context"

interface DownloadedIconProps {
  songId: string
  className?: string
}

export function DownloadedIcon({ songId, className = "" }: DownloadedIconProps) {
  const { isDownloaded } = useDownload()

  console.log("[v0] Checking download status for:", songId, "Downloaded:", isDownloaded(songId))

  if (!isDownloaded(songId)) {
    return null
  }

  return (
    <div className={`flex items-center justify-center w-5 h-5 bg-green-600 rounded-full shadow-lg ${className}`}>
      <Check className="w-3 h-3 text-white" />
    </div>
  )
}
