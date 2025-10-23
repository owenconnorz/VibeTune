"use client"

import { useState } from "react"
import { ArrowLeft, Play, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { useAPI } from "@/lib/use-api"
import { useRouter } from "next/navigation"

interface CategoryItem {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
}

interface CategoryData {
  category: string
  query: string
  items: CategoryItem[]
}

const categoryNames: Record<string, string> = {
  energize: "Energize",
  blues: "Blues",
  "indie-alternative": "Indie & Alternative",
  commute: "Commute",
  "uk-rap": "UK Rap",
  "cosy-season": "Cosy Season 🍁",
  "feel-good": "Feel Good",
  "1990s": "1990s",
  "folk-acoustic": "Folk & Acoustic",
  sleep: "Sleep",
  iraqi: "Iraqi",
  party: "Party",
  pop: "Pop",
  metal: "Metal",
  rock: "Rock",
  classical: "Classical",
  "1980s": "1980s",
  romance: "Romance",
  "1960s": "1960s",
  "1950s": "1950s",
  "desi-hiphop": "Desi Hip-Hop",
  "2010s": "2010s",
  "2000s": "2000s",
  kpop: "K-Pop",
}

export function CategoryContent({ categoryId }: { categoryId: string }) {
  const router = useRouter()
  const { playVideo } = useMusicPlayer()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data, isLoading, error, mutate } = useAPI<CategoryData>(`/api/music/category/${categoryId}`, {
    revalidateOnMount: true,
  })

  const categoryName = categoryNames[categoryId] || categoryId
  const items = data?.items || []

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">{categoryName}</h1>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading {categoryName}...</div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-2">Unable to load {categoryName}</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No music found for {categoryName}</div>
        ) : (
          <div className="space-y-3">
            {items.map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
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
                <span className="text-xs text-muted-foreground">{song.duration}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
