"use client"

import { ArrowLeft, Radio, Shuffle, Play, MoreVertical } from "lucide-react"
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
  subscribers: string
  topSongs: Array<{
    id: string
    title: string
    artist: string
    thumbnail: string
    duration: string
    views: string
  }>
  videos: Array<{
    id: string
    title: string
    thumbnail: string
    views: string
  }>
  albums: Array<{
    id: string
    title: string
    year: string
    thumbnail: string
  }>
  singles: Array<{
    id: string
    title: string
    year: string
    thumbnail: string
  }>
}

export function ArtistContent({ artistId }: { artistId: string }) {
  const router = useRouter()
  const { playVideo, setQueue } = useMusicPlayer()

  const { data, isLoading } = useAPI<{ artist: Artist }>(`/api/artist/${artistId}`)

  const artist = data?.artist

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading artist...</p>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Artist not found</p>
      </div>
    )
  }

  const handleShufflePlay = () => {
    const shuffled = [...artist.topSongs].sort(() => Math.random() - 0.5)
    if (shuffled.length > 0) {
      playVideo(shuffled[0])
      setQueue(shuffled.slice(1))
    }
  }

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold truncate flex-1 mx-4">{artist.name}</h1>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Banner */}
      {artist.banner && (
        <div className="relative w-full h-80">
          <Image src={artist.banner || "/placeholder.svg"} alt={artist.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-5xl font-bold text-white drop-shadow-2xl mb-2">{artist.name}</h1>
            {artist.subscribers && <p className="text-sm text-white/90 drop-shadow-lg">{artist.subscribers}</p>}
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="outline"
            className="rounded-full border-red-500 text-red-500 hover:bg-red-500/10 bg-transparent px-8"
          >
            Subscribe
          </Button>
          <Button variant="outline" className="rounded-full bg-transparent" size="icon">
            <Radio className="w-5 h-5" />
          </Button>
          <Button onClick={handleShufflePlay} className="rounded-full bg-primary/20 hover:bg-primary/30" size="icon">
            <Shuffle className="w-5 h-5" />
          </Button>
        </div>

        {/* Top Songs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Top songs</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
          <div className="space-y-2">
            {artist.topSongs.map((song) => (
              <button
                key={song.id}
                onClick={() => playVideo(song)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors text-left group"
              >
                <div className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0">
                  <Image src={song.thumbnail || "/placeholder.svg"} alt={song.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {song.artist} • {song.duration}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </button>
            ))}
          </div>
        </div>

        {/* Videos */}
        {artist.videos && artist.videos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Videos</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {artist.videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() =>
                    playVideo({
                      id: video.id,
                      title: video.title,
                      artist: artist.name,
                      thumbnail: video.thumbnail,
                      duration: "0:00",
                    })
                  }
                  className="flex-shrink-0 w-48 group"
                >
                  <div className="relative w-48 h-28 rounded-lg overflow-hidden mb-2">
                    <Image
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{video.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{artist.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Albums */}
        {artist.albums && artist.albums.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Albums</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {artist.albums.map((album) => (
                <div key={album.id} className="flex-shrink-0 w-40">
                  <div className="relative w-40 h-40 rounded-lg overflow-hidden mb-2 group cursor-pointer">
                    <Image
                      src={album.thumbnail || "/placeholder.svg"}
                      alt={album.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{album.title}</h3>
                  <p className="text-xs text-muted-foreground">{album.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Singles & EPs */}
        {artist.singles && artist.singles.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Singles & EPs</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {artist.singles.map((single) => (
                <div key={single.id} className="flex-shrink-0 w-40">
                  <div className="relative w-40 h-40 rounded-lg overflow-hidden mb-2 group cursor-pointer">
                    <Image
                      src={single.thumbnail || "/placeholder.svg"}
                      alt={single.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{single.title}</h3>
                  <p className="text-xs text-muted-foreground">{single.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
