"use client"

import { useState } from "react"
import { Play, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { useAPI } from "@/lib/use-api"
import Link from "next/link"

const categories = ["Podcasts", "Energize", "Feel good", "Relax", "Workout", "Commute"]

const moodAndGenres = [
  { id: "energize", name: "Energize", query: "energetic workout music" },
  { id: "blues", name: "Blues", query: "blues music" },
  { id: "indie-alternative", name: "Indie & alternative", query: "indie alternative music" },
  { id: "commute", name: "Commute", query: "commute driving music" },
  { id: "uk-rap", name: "UK rap", query: "uk rap grime music" },
  { id: "cosy-season", name: "Cosy Season 🍁", query: "cosy autumn fall music" },
  { id: "feel-good", name: "Feel good", query: "feel good happy music" },
  { id: "1990s", name: "1990s", query: "1990s music hits" },
  { id: "folk-acoustic", name: "Folk & acoustic", query: "folk acoustic music" },
  { id: "sleep", name: "Sleep", query: "sleep relaxing music" },
  { id: "iraqi", name: "Iraqi", query: "iraqi arabic music" },
  { id: "party", name: "Party", query: "party dance music" },
  { id: "pop", name: "Pop", query: "pop music hits" },
  { id: "metal", name: "Metal", query: "metal rock music" },
  { id: "rock", name: "Rock", query: "rock music" },
  { id: "classical", name: "Classical", query: "classical music" },
  { id: "1980s", name: "1980s", query: "1980s music hits" },
  { id: "romance", name: "Romance", query: "romantic love songs" },
  { id: "1960s", name: "1960s", query: "1960s music hits" },
  { id: "1950s", name: "1950s", query: "1950s music hits" },
  { id: "desi-hiphop", name: "Desi hip-hop", query: "desi hip hop music" },
  { id: "2010s", name: "2010s", query: "2010s music hits" },
  { id: "2000s", name: "2000s", query: "2000s music hits" },
  { id: "kpop", name: "K-Pop", query: "k-pop korean music" },
]

interface HomeFeedSection {
  title: string
  type?: string
  items: Array<{
    id: string
    title: string
    artist: string
    thumbnail: string
    duration: string
    type?: string
    aspectRatio?: string
  }>
}

export function HomeContent() {
  const [selectedCategory, setSelectedCategory] = useState("Podcasts")
  const { playVideo } = useMusicPlayer()

  const { data, isLoading, error } = useAPI<{ sections: HomeFeedSection[] }>("/api/music/home", {
    refreshInterval: 60000,
    revalidateOnMount: true,
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

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Mood and Genres</h2>
          <ChevronRight className="w-6 h-6 text-muted-foreground" />
        </div>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {/* Create pages of 8 items (4 rows x 2 columns) */}
            {Array.from({ length: Math.ceil(moodAndGenres.length / 8) }).map((_, pageIndex) => (
              <div
                key={pageIndex}
                className="grid grid-cols-2 gap-3 flex-shrink-0"
                style={{ width: "calc(100vw - 2rem)" }}
              >
                {moodAndGenres.slice(pageIndex * 8, (pageIndex + 1) * 8).map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/category/${item.id}`}
                    className="bg-muted/40 hover:bg-muted/60 rounded-xl px-4 py-3 transition-colors"
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

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
            {section.type === "list" || sectionIndex === 0 ? (
              // List view for Quick picks and similar sections
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
            ) : section.type === "immersive" ? (
              // Large cards for featured/immersive sections
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="w-72 flex-shrink-0 cursor-pointer group"
                      onClick={() =>
                        playVideo({ id: item.id, title: item.title, artist: item.artist, thumbnail: item.thumbnail })
                      }
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                        <Image
                          src={item.thumbnail || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-12 h-12 fill-white text-white" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-base truncate">{item.title}</h3>
                      {item.artist && <p className="text-sm text-muted-foreground truncate">{item.artist}</p>}
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              // Standard carousel for other sections (albums, playlists, etc.)
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-4">
                  {section.items.map((item) => {
                    // Determine card size based on item type
                    const isVideo = item.aspectRatio === "video"
                    const cardWidth = isVideo ? "w-56" : "w-40"

                    return (
                      <div
                        key={item.id}
                        className={`${cardWidth} flex-shrink-0 cursor-pointer group`}
                        onClick={() =>
                          playVideo({ id: item.id, title: item.title, artist: item.artist, thumbnail: item.thumbnail })
                        }
                      >
                        <div
                          className={`relative ${isVideo ? "aspect-video" : "aspect-square"} rounded-lg overflow-hidden mb-2`}
                        >
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
                    )
                  })}
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
