import { Download, Check } from "lucide-react"
import { useDownload } from "@/contexts/download-context"

interface DownloadedIconProps {
  trackId: string
  className?: string
}

export function DownloadedIcon({ trackId, className = "" }: DownloadedIconProps) {
  const { isDownloaded, isDownloading, downloadProgress } = useDownload()

  if (isDownloading(trackId)) {
    const progress = downloadProgress[trackId] || 0
    return (
      <div className={`relative ${className}`}>
        <Download className="w-4 h-4 text-muted-foreground animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-mono text-white bg-black bg-opacity-50 rounded px-1">{progress}%</div>
        </div>
      </div>
    )
  }

  if (isDownloaded(trackId)) {
    return <Check className={`w-4 h-4 text-green-500 ${className}`} />
  }

  return null
}
