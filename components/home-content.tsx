"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { useAPI } from "@/lib/use-api"
import Link from "next/link"

const categories = ["Podcasts", "Energize", "Feel good", "Relax", "Workout", "Commute"]

const moods = [
  { id: "happy", name: "Happy", color: "from-yellow-500 to-orange-500", query: "happy upbeat music" },
  { id: "sad", name: "Sad", color: "from-blue-500 to-indigo-600", query: "sad emotional music" },
  { id: "energetic", name: "Energetic", color: "from-red-500 to-pink-500", query: "energetic workout music" },
  { id: "calm", name: "Calm", color: "from-green-400 to-teal-500", query: "calm relaxing music" },
  { id: "romantic", name: "Romantic", color: "from-pink-400 to-rose-500", query: "romantic love songs" },
  { id: "party", name: "Party", color: "from-purple-500 to-pink-500", query: "party dance music" },
  { id: "focus", name: "Focus", color: "from-cyan-500 to-blue-500", query: "focus study music" },
  { id: "sleep", name: "Sleep", color: "from-indigo-500 to-purple-600", query: "sleep meditation music" },
]

const genres = [
  { id: "pop", name: "Pop", color: "from-pink-500 to-rose-500", query: "pop music hits" },
  { id: "rock", name: "Rock", color: "from-gray-700 to-gray-900", query: "rock music" },
  { id: "hiphop", name: "Hip Hop", color: "from-orange-500 to-red-600", query: "hip hop rap music" },
  { id: "jazz", name: "Jazz", color: "from-amber-600 to-yellow-700", query: "jazz music" },
  { id: "electronic", name: "Electronic", color: "from-cyan-500 to-blue-600", query: "electronic edm music" },
  { id: "classical", name: "Classical", color: "from-purple-600 to-indigo-700", query: "classical music" },
  { id: "country", name: "Country", color: "from-yellow-600 to-orange-600", query: "country music" },
  { id: "rnb", name: "R&B", color: "from-rose-500 to-pink-600", query: "r&b soul music" },
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

      {/* Moods section */}
      <div className="px-4 space-y-4">
        <h2 className="text-2xl font-bold">Moods</h2>
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4">
            {moods.map((mood) => (
              <Link
                key={mood.id}
                href={`/dashboard/mood/${mood.id}`}
                className="w-40 flex-shrink-0 cursor-pointer group"
              >
                <div
                  className={`relative aspect-square rounded-lg overflow-hidden mb-2 bg-gradient-to-br ${mood.color}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-white font-bold text-xl">{mood.name}</h3>
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 fill-white text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Genres section */}
      <div className="px-4 space-y-4">
        <h2 className="text-2xl font-bold">Genres</h2>
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/dashboard/genre/${genre.id}`}
                className="w-40 flex-shrink-0 cursor-pointer group"
              >
                <div
                  className={`relative aspect-square rounded-lg overflow-hidden mb-2 bg-gradient-to-br ${genre.color}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-white font-bold text-xl">{genre.name}</h3>
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 fill-white text-white" />
                  </div>
                </div>
              </Link>
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
