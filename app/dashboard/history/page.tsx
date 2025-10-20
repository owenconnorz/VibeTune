"use client"

import { useEffect, useState } from "react"
import { historyStorage, type HistoryVideo } from "@/lib/history-storage"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Trash2, Play } from "lucide-react"
import { useMusicPlayer } from "@/components/music-player-provider"

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryVideo[]>([])
  const { playVideo } = useMusicPlayer()

  useEffect(() => {
    setHistory(historyStorage.getHistory())
  }, [])

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your entire history?")) {
      historyStorage.clearHistory()
      setHistory([])
    }
  }

  const handleRemoveVideo = (videoId: string) => {
    const updated = historyStorage.removeFromHistory(videoId)
    setHistory(updated)
  }

  const handlePlayVideo = (video: HistoryVideo) => {
    playVideo({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      channelTitle: video.channelTitle,
      duration: video.duration,
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">History</h1>
            <p className="text-muted-foreground">
              {history.length} video{history.length !== 1 ? "s" : ""} watched
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="destructive" onClick={handleClearHistory}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground">Videos you play will appear here</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((video) => (
              <Card key={`${video.id}-${video.playedAt}`} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0 group cursor-pointer">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded"
                      onClick={() => handlePlayVideo(video)}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold mb-1 line-clamp-2 cursor-pointer hover:text-primary"
                      onClick={() => handlePlayVideo(video)}
                    >
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{video.channelTitle}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(video.playedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVideo(video.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
