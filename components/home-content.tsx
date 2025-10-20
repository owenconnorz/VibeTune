"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { useAPI } from "@/lib/use-api"

const categories = ["Podcasts", "Energize", "Feel good", "Relax", "Workout", "Commute"]

interface HomeFeedSection {
  title: string
  items: Array<{
    id: string
    title: string
    artist: string
    thumbnail: string
    duration: string
  }>
}

export function HomeContent() {
  const [selectedCategory, setSelectedCategory] = useState("Podcasts")
  const { playVideo } = useMusicPlayer()

  const { data, isLoading, error } = useAPI<{ sections: HomeFeedSection[] }>("/api/music/home", {
    refreshInterval: 300000, // Refresh every 5 minutes
  })

  const homeFeed = data?.sections || []

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

      {isLoading ? (
        <div className="px-4 py-8 text-center text-muted-foreground">Loading recommendations...</div>
      ) : error ? (
        <div className="px-4 py-8 text-center">
          <p className="text-muted-foreground mb-2">Unable to load recommendations</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      ) : homeFeed.length === 0 ? (
        <div className="px-4 py-8 text-center text-muted-foreground">No recommendations available</div>
      ) : (
        homeFeed.map((section, sectionIndex) => (
          <div key={sectionIndex} className="px-4 space-y-4">
            <h2 className="text-2xl font-bold">{section.title}</h2>
            {sectionIndex === 0 ? (
              // First section as list view (Quick picks style)
              <div className="space-y-3">
                {section.items.slice(0, 6).map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() =>
                      playVideo({ id: song.id, title: song.title, artist: song.artist, thumbnail: song.thumbnail })
                    }
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={song.thumbnail || "/placeholder.svg"}
                        alt={song.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-6 h-6 fill-white text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{song.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
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
            ) : (
              // Other sections as horizontal scroll (carousel style)
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-4">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="w-40 flex-shrink-0 cursor-pointer group"
                      onClick={() =>
                        playVideo({ id: item.id, title: item.title, artist: item.artist, thumbnail: item.thumbnail })
                      }
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                        <Image
                          src={item.thumbnail || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-8 h-8 fill-white text-white" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
        ))
      )}
    </div>
  )
}
