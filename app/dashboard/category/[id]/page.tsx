"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import { useAPI } from "@/lib/use-api"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Image from "next/image"
import Link from "next/link"

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
}

interface CategoryData {
  name: string
  subcategories: Subcategory[]
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { id } = params
  const { playVideo } = useMusicPlayer()

  const { data, isLoading } = useAPI<CategoryData>(`/api/music/category/${id}`)

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
          data.subcategories.map((subcategory, index) => (
            <div key={index} className="space-y-4">
              <h2 className="text-xl font-bold">{subcategory.title}</h2>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {subcategory.playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="flex-shrink-0 w-40 cursor-pointer group"
                      onClick={() => playVideo(playlist)}
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                        <Image
                          src={playlist.thumbnail || "/placeholder.svg"}
                          alt={playlist.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">{playlist.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{playlist.artist}</p>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground">No playlists found</div>
        )}
      </div>
    </div>
  )
}
