"use client"

import { useEffect, useState } from "react"
import { useDownloadManager } from "@/components/download-manager-provider"
import { Download, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function DownloadProgressToast() {
  const { downloads, isDownloading, getProgress, clearCompleted, retryFailed, retryDownload } = useDownloadManager()
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const progress = getProgress()
  const hasDownloads = downloads.length > 0
  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0

  useEffect(() => {
    if (hasDownloads) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 500)
      return () => clearTimeout(timer)
    }
  }, [hasDownloads])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-24 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
            ) : progress.failed > 0 ? (
              <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {isDownloading
                  ? `Downloading ${progress.pending + progress.downloading} song${progress.pending + progress.downloading > 1 ? "s" : ""}...`
                  : progress.failed > 0
                    ? `${progress.completed} completed, ${progress.failed} failed`
                    : `${progress.completed} song${progress.completed > 1 ? "s" : ""} downloaded`}
              </p>
              <p className="text-xs text-muted-foreground">
                {progress.completed} / {progress.total}
                {progress.failed > 0 && ` (${progress.failed} failed)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {progress.failed > 0 && !isDownloading && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  retryFailed()
                }}
                title="Retry failed downloads"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                clearCompleted()
              }}
              title="Clear completed"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-3 pb-3">
          <Progress value={progressPercent} className="h-1" />
        </div>

        {/* Expanded List */}
        {isExpanded && (
          <div className="border-t border-border max-h-60 overflow-y-auto">
            {downloads.map((download) => (
              <div key={download.id} className="flex items-center gap-2 p-3 border-b border-border last:border-0">
                <div className="flex-shrink-0">
                  {download.status === "downloading" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {download.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {download.status === "failed" && <XCircle className="w-4 h-4 text-destructive" />}
                  {download.status === "pending" && <Download className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{download.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {download.artist}
                    {download.status === "failed" && download.error && ` • ${download.error}`}
                    {download.status === "failed" && download.retryCount && ` (Attempt ${download.retryCount})`}
                  </p>
                </div>
                {download.status === "failed" && (download.retryCount || 0) < 3 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      retryDownload(download.id)
                    }}
                    title="Retry download"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
