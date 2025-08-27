"use client"

import { useState, useEffect } from "react"
import { usePlaylist } from "@/contexts/playlist-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useSettings } from "@/contexts/settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Heart, Download, FolderOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface VideoTrack {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  videoUrl: string
  isVideo: boolean
  source?: string
  playlistIds: string[]
}

export default function VideosLibraryPage() {
  const { playlists } = usePlaylist()
  const { playTrack } = useAudioPlayer()
  const { settings } = useSettings()
  const router = useRouter()
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    if (settings && !settings.showAdultContent) {
      router.push("/library")
      return
    }
  }, [settings, router])

  useEffect(() => {
    const allVideoTracks: VideoTrack[] = []
    const trackMap = new Map<string, VideoTrack>()

    playlists.forEach((playlist) => {
      playlist.songs.forEach((song) => {
        if (song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_")) {
          const existingTrack = trackMap.get(song.id)
          if (existingTrack) {
            existingTrack.playlistIds.push(playlist.id)
          } else {
            const videoTrack: VideoTrack = {
              id: song.id,
              title: song.title,
              artist: song.artist || "Adult Video",
              thumbnail: song.thumbnail || "/placeholder-hucye.png",
              duration: song.duration || "0:00",
              videoUrl: song.videoUrl || song.url || "",
              isVideo: true,
              source: song.source || "eporner",
              playlistIds: [playlist.id],
            }
            trackMap.set(song.id, videoTrack)
            allVideoTracks.push(videoTrack)
          }
        }
      })
    })

    setVideoTracks(allVideoTracks)
  }, [playlists])

  const videoPlaylists = playlists.filter((playlist) =>
    playlist.songs.some((song) => song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_")),
  )

  const handlePlayVideo = (video: VideoTrack) => {
    const track = {
      id: video.id,
      title: video.title,
      artist: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      videoUrl: video.videoUrl,
      isVideo: true,
      source: video.source,
    }
    playTrack(track)
  }

  const handleOpenPlaylist = (playlistId: string) => {
    router.push(`/library/playlist/${playlistId}`)
  }

  const filteredVideos =
    selectedCategory === "all"
      ? videoTracks
      : videoTracks.filter((video) => video.playlistIds.includes(selectedCategory))

  if (!settings?.showAdultContent) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Video Library</h1>
          <p className="text-muted-foreground">
            {videoTracks.length} videos across {videoPlaylists.length} playlists
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All Videos ({videoTracks.length})
          </Button>
          {videoPlaylists.map((playlist) => (
            <Button
              key={playlist.id}
              variant={selectedCategory === playlist.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(playlist.id)}
            >
              {playlist.name} ({playlist.songs.filter((s) => s.isVideo || s.source === "eporner").length})
            </Button>
          ))}
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold mb-2">No videos found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategory === "all"
                ? "Add videos to your playlists to see them here"
                : "No videos in this playlist"}
            </p>
            <Button onClick={() => router.push("/videos")}>Browse Videos</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-video">
                  <Image src={video.thumbnail || "/placeholder.svg"} alt={video.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="lg" className="rounded-full" onClick={() => handlePlayVideo(video)}>
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                    {video.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{video.artist}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {video.playlistIds.map((playlistId) => {
                      const playlist = playlists.find((p) => p.id === playlistId)
                      return playlist ? (
                        <Badge
                          key={playlistId}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleOpenPlaylist(playlistId)}
                        >
                          <FolderOpen className="h-3 w-3 mr-1" />
                          {playlist.name}
                        </Badge>
                      ) : null
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handlePlayVideo(video)} className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                    <Button size="sm" variant="outline">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
