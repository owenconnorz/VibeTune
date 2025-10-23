"use client"

import { useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import { useAPI } from "@/lib/use-api"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Link from "next/link"
import { ProgressiveImage } from "@/components/progressive-image"

interface CategoryPageProps {
  params: { id: string }
}

interface Playlist {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
}

interface Subcategory {
  title: string
  playlists: Playlist[]
  continuation?: string | null
  query?: string
  index?: number
}

interface CategoryData {
  name: string
  subcategories: Subcategory[]
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { id } = params
  const { playVideo } = useMusicPlayer()
  const [subcategoryItems, setSubcategoryItems] = useState<Record<number, Playlist[]>>({})
  const [subcategoryContinuations, setSubcategoryContinuations] = useState<Record<number, string | null>>({})
  const [loadingMore, setLoadingMore] = useState<Record<number, boolean>>({})

  const { data, isLoading } = useAPI<CategoryData>(`/api/music/category/${id}`)

  const loadMoreForSubcategory = async (subcategoryIndex: number, continuation: string) => {
    if (loadingMore[subcategoryIndex]) return

    setLoadingMore((prev) => ({ ...prev, [subcategoryIndex]: true }))

    try {
      const response = await fetch(
        `/api/music/category/${id}?continuation=${continuation}&subcategoryIndex=${subcategoryIndex}`,
      )
      const newData = await response.json()

      if (newData.playlists && newData.playlists.length > 0) {
        setSubcategoryItems((prev) => ({
          ...prev,
          [subcategoryIndex]: [...(prev[subcategoryIndex] || []), ...newData.playlists],
        }))
        setSubcategoryContinuations((prev) => ({
          ...prev,
          [subcategoryIndex]: newData.continuation || null,
        }))
      }
    } catch (error) {
      console.error("[v0] Error loading more playlists:", error)
    } finally {
      setLoadingMore((prev) => ({ ...prev, [subcategoryIndex]: false }))
    }
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{data?.name || "Loading..."}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-8">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading playlists...</div>
        ) : data?.subcategories && data.subcategories.length > 0 ? (
          data.subcategories.map((subcategory, index) => {
            const allPlaylists = [...subcategory.playlists, ...(subcategoryItems[index] || [])]
            const hasContinuation =
              subcategoryContinuations[index] !== undefined ? subcategoryContinuations[index] : subcategory.continuation
            const isLoadingMore = loadingMore[index]

            return (
              <div key={index} className="space-y-4">
                <h2 className="text-xl font-bold">{subcategory.title}</h2>
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-4">
                    {allPlaylists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className="flex-shrink-0 w-40 cursor-pointer group"
                        onClick={() => playVideo(playlist)}
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                          <ProgressiveImage
                            src={playlist.thumbnail || "/placeholder.svg"}
                            alt={playlist.title}
                            rounded="lg"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <svg className="w-12 h-12 fill-white text-white" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{playlist.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{playlist.artist}</p>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
                {hasContinuation && (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => loadMoreForSubcategory(index, hasContinuation)}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                )}
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-muted-foreground">No playlists found</div>
        )}
      </div>
    </div>
  )
}
