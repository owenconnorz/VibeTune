"use client"

import type React from "react"
import { useDownload } from "@/contexts/download-context"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Pause, Play, X, Trash2 } from "lucide-react"

export const DownloadManager: React.FC = () => {
  const {
    downloads,
    downloadedSongs,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
    clearAllDownloads,
  } = useDownload()

  const activeDownloads = downloads.filter((d) => d.status !== "completed")
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  if (activeDownloads.length === 0 && downloadedSongs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No downloads yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active Downloads */}
      {activeDownloads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Active Downloads ({activeDownloads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDownloads.map((download) => (
              <div key={download.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img
                  src={download.thumbnail || "/placeholder.svg"}
                  alt={download.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{download.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{download.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={download.progress} className="flex-1" />
                    <span className="text-xs text-muted-foreground">{download.progress}%</span>
                  </div>
                  {download.size && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(download.downloadedSize || 0)} / {formatFileSize(download.size)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {download.status === "downloading" && (
                    <Button size="sm" variant="outline" onClick={() => pauseDownload(download.id)}>
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {download.status === "paused" && (
                    <Button size="sm" variant="outline" onClick={() => resumeDownload(download.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => cancelDownload(download.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Downloaded Songs */}
      {downloadedSongs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">Downloaded Songs ({downloadedSongs.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={clearAllDownloads}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {downloadedSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img
                  src={song.thumbnail || "/placeholder.svg"}
                  alt={song.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                  <p className="text-xs text-muted-foreground">Downloaded {song.completedAt?.toLocaleDateString()}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => deleteDownload(song.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
