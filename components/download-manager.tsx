"use client"

import { useState } from "react"
import { Download, Trash2, Music, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDownload } from "@/contexts/download-context"
import { formatDistanceToNow } from "date-fns"

export function DownloadManager() {
  const { downloadedTracks } = useDownload()
  const [selectedTracks, setSelectedTracks] = useState<string[]>([])

  const getTrackData = (trackId: string) => {
    const saved = localStorage.getItem(`track_${trackId}`)
    return saved ? JSON.parse(saved) : null
  }

  const clearAllDownloads = () => {
    downloadedTracks.forEach((trackId) => {
      localStorage.removeItem(`track_${trackId}`)
    })
    localStorage.removeItem("downloadedTracks")
    window.location.reload() // Simple way to refresh the download state
  }

  const downloadedTrackData = downloadedTracks
    .map(getTrackData)
    .filter(Boolean)
    .sort((a, b) => b.downloadedAt - a.downloadedAt)

  if (downloadedTracks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Download className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Downloaded Songs</h3>
          <p className="text-muted-foreground text-center">Songs you download will appear here for offline listening</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Downloaded Songs ({downloadedTracks.length})
          </CardTitle>
          <Button variant="destructive" size="sm" onClick={clearAllDownloads} className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {downloadedTrackData.map((track) => (
              <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  {track.thumbnail ? (
                    <img
                      src={track.thumbnail || "/placeholder.svg"}
                      alt={track.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Music className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{track.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    Downloaded {formatDistanceToNow(track.downloadedAt)} ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
