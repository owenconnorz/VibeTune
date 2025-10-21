"use client"

import { ArrowLeft, Radio, Shuffle, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useMusicPlayer } from "@/components/music-player-provider"
import Image from "next/image"
import { useAPI } from "@/lib/use-api"

interface Artist {
  id: string
  name: string
  thumbnail: string
  banner?: string
  description: string
  topSongs: Array<{
    id: string
    title: string
    artist: string
    thumbnail: string
    duration: string
    views: string
  }>
}

export function ArtistContent({ artistId }: { artistId: string }) {
  const router = useRouter()
  const { playVideo } = useMusicPlayer()

  const { data, isLoading } = useAPI<{ artist: Artist }>(`/api/music/artist/${artistId}`)

  const artist = data?.artist

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading artist...</p>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Artist not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-semibold truncate flex-1 mx-4">{artist.name}</h1>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Banner */}
      {artist.banner && (
        <div className="relative w-full h-48 md:h-64">
          <Image src={artist.banner || "/placeholder.svg"} alt={artist.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Artist Info */}
        <div className="text-center space-y-4">
          <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
            <Image src={artist.thumbnail || "/placeholder.svg"} alt={artist.name} fill className="object-cover" />
          </div>
          <h1 className="text-3xl font-bold">{artist.name}</h1>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" className="rounded-full bg-transparent">
              Subscribe
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-transparent">
              <Radio className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-transparent">
              <Shuffle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Top Songs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary">Top songs</h2>
            <Button variant="ghost" size="sm">
              See all
            </Button>
          </div>
          <div className="space-y-2">
            {artist.topSongs.map((song, index) => (
              <button
                key={song.id}
                onClick={() =>
                  playVideo({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    thumbnail: song.thumbnail,
                    duration: song.duration,
                  })
                }
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <span className="text-muted-foreground w-6">{index + 1}</span>
                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <Image src={song.thumbnail || "/placeholder.svg"} alt={song.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{artist.name}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
