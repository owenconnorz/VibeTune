"use client"

import { Play, Pause, Heart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import Link from "next/link"

export function MiniPlayer() {
  const { currentVideo, isPlaying, togglePlay } = useMusicPlayer()

  if (!currentVideo) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border z-30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/now-playing" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={currentVideo.thumbnail || "/placeholder.svg"}
                alt={currentVideo.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{currentVideo.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentVideo.artist}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="w-5 h-5" />
            </Button>
            <Button size="icon" onClick={togglePlay} className="rounded-full w-12 h-12">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
