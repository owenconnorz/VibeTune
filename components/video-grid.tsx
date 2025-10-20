"use client"

import { Card } from "@/components/ui/card"
import { Play, Plus } from "lucide-react"
import type { YouTubeVideo } from "@/lib/youtube"
import { useMusicPlayer } from "@/components/music-player-provider"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface VideoGridProps {
  videos: YouTubeVideo[]
}

export function VideoGrid({ videos }: VideoGridProps) {
  const { playVideo } = useMusicPlayer()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {videos.map((video) => (
        <Card key={video.id} className="group hover:shadow-lg transition-all overflow-hidden">
          <div className="relative aspect-square cursor-pointer" onClick={() => playVideo(video)}>
            <Image src={video.thumbnail || "/placeholder.svg"} alt={video.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Play className="w-6 h-6 text-primary-foreground fill-current" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{video.artist}</p>
            <AddToPlaylistDialog
              video={video}
              trigger={
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add to Playlist
                </Button>
              }
            />
          </div>
        </Card>
      ))}
    </div>
  )
}
