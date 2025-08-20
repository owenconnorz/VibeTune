"use client"

import type React from "react"
import { useDownload } from "@/contexts/download-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, Check, Pause, AlertCircle } from "lucide-react"

interface DownloadStatusBadgeProps {
  songId: string
  className?: string
  showProgress?: boolean
}

export const DownloadStatusBadge: React.FC<DownloadStatusBadgeProps> = ({ songId, className, showProgress = true }) => {
  const { downloads, isDownloaded, getDownloadProgress } = useDownload()

  const currentDownload = downloads.find((d) => d.id === songId)
  const progress = getDownloadProgress(songId)
  const downloaded = isDownloaded(songId)

  if (!currentDownload && !downloaded) return null

  const getStatusInfo = () => {
    if (downloaded) {
      return {
        icon: <Check className="h-3 w-3" />,
        text: "Downloaded",
        variant: "default" as const,
        className: "bg-green-500 hover:bg-green-600",
      }
    }

    switch (currentDownload?.status) {
      case "downloading":
        return {
          icon: <Download className="h-3 w-3 animate-pulse" />,
          text: `${progress}%`,
          variant: "secondary" as const,
          className: "bg-blue-500 hover:bg-blue-600",
        }
      case "paused":
        return {
          icon: <Pause className="h-3 w-3" />,
          text: "Paused",
          variant: "secondary" as const,
          className: "bg-yellow-500 hover:bg-yellow-600",
        }
      case "failed":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: "Failed",
          variant: "destructive" as const,
          className: "",
        }
      case "pending":
        return {
          icon: <Download className="h-3 w-3" />,
          text: "Queued",
          variant: "outline" as const,
          className: "",
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusInfo()
  if (!statusInfo) return null

  return (
    <div className={className}>
      <Badge variant={statusInfo.variant} className={`flex items-center gap-1 ${statusInfo.className}`}>
        {statusInfo.icon}
        <span className="text-xs">{statusInfo.text}</span>
      </Badge>

      {showProgress && currentDownload?.status === "downloading" && <Progress value={progress} className="h-1 mt-1" />}
    </div>
  )
}
