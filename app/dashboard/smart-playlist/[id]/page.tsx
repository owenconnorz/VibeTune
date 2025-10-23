"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Play, Shuffle, MoreVertical, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import type { YouTubeVideo } from "@/lib/youtube"
import { smartPlaylistTemplates } from "@/lib/smart-playlist-generator"
import { savePlaylist } from "@/lib/playlist-storage"
import { useToast } from "@/hooks/use-toast"

export default function SmartPlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const { playVideo, setQueue } = useMusicPlayer()
  const { toast } = useToast()
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<any>(null)

  useEffect(() => {
    const id = params.id as string
    const foundTemplate = smartPlaylistTemplates.find((t) => t.id === id)
    setTemplate(foundTemplate)

    if (foundTemplate) {
      loadPlaylist(id)
    }
  }, [params.id])

  const loadPlaylist = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/smart-playlists/${id}`)
      const data = await response.json()

      if (data.success && data.playlist) {
        setVideos(data.playlist.videos)
      }
    } catch (error) {
      console.error("[v0] Error loading smart playlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAll = () => {
    if (videos.length > 0) {
      playVideo(videos[0])
      setQueue(videos.slice(1))
    }
  }

  const handleShuffle = () => {
    if (videos.length > 0) {
      const shuffled = [...videos].sort(() => Math.random() - 0.5)
      playVideo(shuffled[0])
      setQueue(shuffled.slice(1))
    }
  }

  const handleSaveAsPlaylist = () => {
    if (!template || videos.length === 0) return

    const playlist = savePlaylist({
      name: template.name,
      description: template.description,
      videos: videos,
    })

    toast({
      title: "Playlist saved",
      description: `"${template.name}" has been saved to your library`,
    })

    router.push(`/dashboard/playlist/${playlist.id}`)
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Playlist not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className={`bg-gradient-to-br ${template.color} p-6 space-y-4`}>
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/20">
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">{template.name}</h1>
          <p className="text-white/90">{template.description}</p>
          <p className="text-sm text-white/70">{videos.length} songs</p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button
            size="lg"
            className="rounded-full gap-2"
            onClick={handlePlayAll}
            disabled={loading || videos.length === 0}
          >
            <Play className="w-5 h-5 fill-current" />
            Play
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full gap-2"
            onClick={handleShuffle}
            disabled={loading || videos.length === 0}
          >
            <Shuffle className="w-5 h-5" />
            Shuffle
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full gap-2"
            onClick={handleSaveAsPlaylist}
            disabled={loading || videos.length === 0}
          >
            <Plus className="w-5 h-5" />
            Save
          </Button>
        </div>
      </div>

      {/* Songs List */}
      <div className="p-4 space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No songs found</p>
          </div>
        ) : (
          videos.map((video, index) => (
            <div
              key={video.id}
              onClick={() => {
                playVideo(video)
                setQueue(videos.slice(index + 1))
              }}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{video.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{video.artist}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
