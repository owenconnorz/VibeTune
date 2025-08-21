"use client"

import { Check } from "lucide-react"
import { useDownload } from "@/contexts/download-context"
import { memo } from "react"

interface DownloadedIconProps {
  songId: string
  className?: string
}

export const DownloadedIcon = memo(function DownloadedIcon({ songId, className = "" }: DownloadedIconProps) {
  const { isDownloaded } = useDownload()

  const downloaded = isDownloaded(songId)

  if (!downloaded) {
    return null
  }

  return (
    <div className={`flex items-center justify-center w-5 h-5 bg-green-600 rounded-full shadow-lg ${className}`}>
      <Check className="w-3 h-3 text-white" />
    </div>
  )
})
