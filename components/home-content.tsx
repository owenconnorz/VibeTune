"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"

const categories = ["Podcasts", "Energize", "Feel good", "Relax", "Workout", "Commute"]

const quickPicks = [
  { id: "1", title: "Say Yes To Heaven", artist: "Lana Del Rey", thumbnail: "/placeholder.svg?height=120&width=120" },
  { id: "2", title: "Born To Die", artist: "Lana Del Rey", thumbnail: "/placeholder.svg?height=120&width=120" },
  { id: "3", title: "Pink Pony Club", artist: "Chappell Roan", thumbnail: "/placeholder.svg?height=120&width=120" },
  { id: "4", title: "My Kink Is Karma", artist: "Chappell Roan", thumbnail: "/placeholder.svg?height=120&width=120" },
]

export function HomeContent() {
  const [selectedCategory, setSelectedCategory] = useState("Podcasts")
  const { playVideo } = useMusicPlayer()

  return (
    <div className="space-y-6">
      {/* Categories */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 px-4 py-4">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              className="rounded-full px-6 whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Quick Picks */}
      <div className="px-4 space-y-4">
        <h2 className="text-2xl font-bold">Quick picks</h2>
        <div className="space-y-3">
          {quickPicks.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() =>
                playVideo({ id: song.id, title: song.title, artist: song.artist, thumbnail: song.thumbnail })
              }
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={song.thumbnail || "/placeholder.svg"} alt={song.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-6 h-6 fill-white text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{song.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Your YouTube Playlists */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Image src="/placeholder.svg?height=40&width=40" alt="Profile" width={40} height={40} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your YouTube playlists</p>
              <h2 className="text-xl font-bold">Owen Ziska</h2>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-32 flex-shrink-0">
                <div className="aspect-square rounded-lg bg-secondary mb-2" />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
