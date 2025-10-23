"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Music2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { artistStorage, type FollowedArtist } from "@/lib/artist-storage"
import { ArtistFollowButton } from "@/components/artist-follow-button"
import Image from "next/image"

export default function ArtistsPage() {
  const router = useRouter()
  const [artists, setArtists] = useState<FollowedArtist[]>([])

  useEffect(() => {
    setArtists(artistStorage.getFollowedArtists())

    const handleUpdate = () => {
      setArtists(artistStorage.getFollowedArtists())
    }

    window.addEventListener("artistsUpdated", handleUpdate)
    return () => window.removeEventListener("artistsUpdated", handleUpdate)
  }, [])

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Following</h1>
        <Button variant="ghost" size="icon">
          <Search className="w-6 h-6" />
        </Button>
      </div>

      {/* Artists List */}
      <div className="p-4">
        {artists.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Music2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">No artists yet</h2>
              <p className="text-muted-foreground">
                Follow your favorite artists to see their latest releases and updates
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                  {artist.thumbnail ? (
                    <Image
                      src={artist.thumbnail || "/placeholder.svg"}
                      alt={artist.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{artist.name}</h3>
                  <p className="text-sm text-muted-foreground">Artist</p>
                </div>
                <ArtistFollowButton
                  artistId={artist.id}
                  artistName={artist.name}
                  artistThumbnail={artist.thumbnail}
                  variant="secondary"
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
