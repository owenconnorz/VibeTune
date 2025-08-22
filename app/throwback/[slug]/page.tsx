"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useMoodPlaylist } from "@/hooks/use-music-data"
import { SongMenu } from "@/components/song-menu"
import { DownloadedIcon } from "@/components/downloaded-icon"
import { OptimizedImage } from "@/components/optimized-image"
import { SongSkeleton, ErrorMessage } from "@/components/loading-skeleton"

const throwbackQueries: Record<string, string[]> = {
  "80s-sing-alongs": ["Madonna 80s hits", "Kiss 80s rock songs", "Bon Jovi classic hits", "80s sing along songs"],
  "relaxing-80s-rock": [
    "UB40 classic hits",
    "Huey Lewis and the News",
    "Phil Collins 80s songs",
    "relaxing 80s rock music",
  ],
  "'90s-dance": [
    "Chemical Brothers 90s hits",
    "Fatboy Slim dance tracks",
    "90s electronic dance music",
    "90s rave classics",
  ],
}

export default function ThrowbackPage() {
  const params = useParams()
  const router = useRouter()
  const { playTrack, playQueue } = useAudioPlayer()
  const slug = params.slug as string

  const queries = throwbackQueries[slug] || [`${slug.replace(/-/g, " ")} music`]
  const { songs, loading, error } = useMoodPlaylist(queries)

  const categoryTitle = useMemo(() => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }, [slug])

  const convertToTrack = (song: any) => ({
    id: song.id,
    title: song.title,
    artist: song.artist || song.channelTitle,
    thumbnail: song.thumbnail,
    duration: song.duration,
  })

  const handlePlaySong = (song: any, songList: any[]) => {
    const tracks = songList.map(convertToTrack)
    const startIndex = songList.findIndex((s) => s.id === song.id)
    playQueue(tracks, startIndex)
  }

  const handlePlayAll = () => {
    if (songs.length > 0) {
      const tracks = songs.map(convertToTrack)
      playQueue(tracks, 0)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 bg-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-white">{categoryTitle}</h1>
      </header>

      <div className="px-4 pb-20">
        {/* Category Header */}
        <div className="py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">📻</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{categoryTitle}</h2>
              <p className="text-gray-400">{songs.length} songs</p>
            </div>
          </div>

          {songs.length > 0 && (
            <Button onClick={handlePlayAll} className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8">
              <Play className="w-4 h-4 mr-2" />
              Play All
            </Button>
          )}
        </div>

        {/* Songs List */}
        {error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="space-y-2">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SongSkeleton key={i} />)
              : songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
                    onClick={() => handlePlaySong(song, songs)}
                  >
                    <div className="w-8 text-gray-400 text-sm font-medium">{index + 1}</div>
                    <OptimizedImage
                      src={song.thumbnail}
                      alt={`${song.title} thumbnail`}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{song.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                    </div>
                    <div className="text-gray-400 text-sm">{song.duration}</div>
                    <div className="flex items-center gap-2">
                      <DownloadedIcon songId={song.id} />
                      <SongMenu song={song} />
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  )
}
